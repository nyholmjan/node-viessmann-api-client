import { expect } from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as nock from 'nock';
import { Interceptor } from 'nock';
import 'mocha';

import { initializeClient, ViessmannClientConfig, ViessmannInstallation } from '../src/viessmann-api-client';
import { ViessmannOAuthConfig, AuthenticationFailed } from '../src/oauth-client';

// Note: augmenting nock.Interceptor here until type def is fixed
declare module "nock" {
    interface Interceptor {
        matchHeader(name: string, value: string | RegExp | { (value: string): boolean; }): this;
    }
}

chai.use(chaiAsPromised);

const refreshToken = 'refresh_token';
const accessToken = 'access_token';

describe('viessmann api client', () => {

    afterEach('cleanup nock', () => {
        nock.cleanAll();
    });

    describe('initialized with user and password', () => {

        const auth: ViessmannOAuthConfig = {
            credentials: {
                user: 'some@user.com',
                password: 'secret'
            },
            host: 'https://iam.mockedapi.com',
            authorize: '/idp/v1/authorize',
            token: '/idp/v1/token'
        };

        const config: ViessmannClientConfig = {
            auth: auth,
            api: {
                host: 'https://api.mockedapi.com'
            }
        };

        it('should request auth code and access token', async () => {
            let authScope = setupOAuth(auth);
            setupData(config);

            await initializeClient(config);
            authScope.done();
        });


        it('should report error if authorization code could not be retrieved', async () => {
            nock(auth.host)
                .post(auth.authorize, '')
                .query(() => { return true; })
                .reply(200, 'the response body') // api replies with login page if credentials don't match

            return expect(initializeClient(config)).to.eventually.be.rejectedWith(AuthenticationFailed);
        });
    });

    describe('initialized with refresh token', async () => {

        const auth: ViessmannOAuthConfig = {
            credentials: {
                refreshToken: refreshToken
            },
            host: 'https://iam.mockedapi.com',
            authorize: '/idp/v1/authorize',
            token: '/idp/v1/token'
        };

        const config: ViessmannClientConfig = {
            auth: auth,
            api: {
                host: 'https://api.mockedapi.com'
            }
        };

        it('should request a new access token', async () => {
            nock(auth.host)
                .post(auth.token, new RegExp('grant_type=refresh_token&refresh_token=' + refreshToken))
                .reply(200, {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    token_type: 'Bearer',
                    expires_in: 3600
                });
            setupData(config);
            await initializeClient(config);
        });
    });

    describe('that is initialized', async () => {
        const config: ViessmannClientConfig = {
            auth: {
                credentials: {
                    user: 'some@user.com',
                    password: 'secret'
                },
                host: 'https://iam.mockedapi.com',
                authorize: '/idp/v1/authorize',
                token: '/idp/v1/token'
            },
            api: {
                host: 'https://api.mockedapi.com'
            }
        };

        it('should notify about initial refresh token', async () => {
            let notifiedToken: string;
            config.auth.onRefresh = (rt: string) => { notifiedToken = rt; };

            setupOAuth(config.auth);
            setupData(config);

            await initializeClient(config);
            expect(notifiedToken).to.be.equal(refreshToken);
        });

        it('should request installations', async () => {
            setupOAuth(config.auth);
            let dataScope = setupData(config);

            const expectedInstallation: ViessmannInstallation = {
                installationId: '99999',
                gatewayId: '123456',
                deviceId: '0'
            };
            const client = await initializeClient(config);
            expect(client.getInstallation()).to.be.deep.equal(expectedInstallation);
            dataScope.done();
        });

        it('should refresh access token proactively if it is expired', async () => {
            const newAccessToken = 'new_access_token';
            const newRefreshToken = 'new_refresh_token';

            let notifiedToken: string;
            config.auth.onRefresh = (rt) => { notifiedToken = rt; };

            let authScope = setupOAuth(config.auth, -1); // negative expire_in to force refresh

            authScope.post(config.auth.token, new RegExp('grant_type=refresh_token&refresh_token=' + refreshToken))
                .reply(200, {
                    access_token: newAccessToken,
                    refresh_token: newRefreshToken,
                    token_type: 'Bearer',
                    expires_in: 3600
                });

            let dataScope = setupData(config, newAccessToken);
            await initializeClient(config);

            expect(notifiedToken).to.be.equal(newRefreshToken);
            authScope.done();
            dataScope.done();
        });

        it('should retry with refreshed access token if access token is rejected', async () => {
            const newAccessToken = 'new_access_token';
            setupOAuth(config.auth)
                .post(config.auth.token, new RegExp('grant_type=refresh_token&refresh_token=' + refreshToken))
                .reply(200, {
                    access_token: newAccessToken,
                    refresh_token: refreshToken,
                    token_type: 'Bearer',
                    expires_in: 3600
                });
            nock(config.api.host)
                .get('/general-management/installations')
                .matchHeader('authorization', 'Bearer ' + accessToken)
                .reply(401, 'some error in body')
                .get('/general-management/installations')
                .matchHeader('authorization', 'Bearer ' + newAccessToken)
                .reply(200, responseBody('installations'));

            await initializeClient(config);
        });

        it('should report error of access token could not be retrieved', () => {
            setupAuthCode(config.auth, 'irrelevant')
                .post(config.auth.token, new RegExp('.*'))
                .reply(400, { "error": "invalid-token-request" });

            return expect(initializeClient(config)).to.eventually.be.rejectedWith(AuthenticationFailed);
        });

        it('should report error if access token could not be refreshed', () => {
            // negative expiresIn to force refresh
            setupOAuth(config.auth, -1)
                .post(config.auth.token, new RegExp('grant_type=refresh_token&refresh_token=' + refreshToken))
                .reply(400, { "error": "invalid-token-request" });

            return expect(initializeClient(config)).to.eventually.be.rejectedWith(AuthenticationFailed);
        });

    });

    describe('requesting data', async () => {
        const config: ViessmannClientConfig = {
            auth: {
                credentials: {
                    user: 'some@user.com',
                    password: 'secret'
                },
                host: 'https://iam.mockedapi.com',
                authorize: '/idp/v1/authorize',
                token: '/idp/v1/token'
            },
            api: {
                host: 'https://api.mockedapi.com'
            }
        };

        it('should fetch the current external temperature upon request', async () => {
            setupOAuth(config.auth);
            setupData(config)
                .get(dataPath('heating.sensors.temperature.outside'))
                .reply(200, responseBody('heating.sensors.temperature.outside'));


            const client = await initializeClient(config);
            const temperature = client.getExternalTemperature();
            return expect(temperature).to.eventually.be.equal(7.6);
        });

        it('should fetch the current boiler temperature upon request', async () => {
            setupOAuth(config.auth);
            setupData(config)
                .get(dataPath('heating.boiler.sensors.temperature.main'))
                .reply(200, responseBody('heating.boiler.sensors.temperature.main'));

            const client = await initializeClient(config);
            const temperature = client.getBoilerTemperature();
            return expect(temperature).to.eventually.be.equal(36);
        });
    });
});

function setupOAuth(oauthConfig: ViessmannOAuthConfig, expiresIn?: number) {
    const authCode = '12345';
    return setupAuthCode(oauthConfig, authCode)
        .post(oauthConfig.token, new RegExp('code=' + authCode))
        .reply(200, {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: expiresIn ? expiresIn : 3600
        });
};

function setupAuthCode(oauthConfig: ViessmannOAuthConfig, authCode: string) {
    return nock(oauthConfig.host)
        .post(oauthConfig.authorize, '')
        .query(() => { return true; })
        .reply(302, 'the response body', {
            'location': 'some/url?code=' + authCode
        });
};

function setupData(config: ViessmannClientConfig, token?: string) {
    return nock(config.api.host)
        .matchHeader('authorization', 'Bearer ' + (token ? token : accessToken))
        .get('/general-management/installations')
        .reply(200, responseBody('installations'));
}

function dataPath(feature: string): string {
    return '/operational-data/installations/99999/gateways/123456/devices/0/features/' + feature;
}

function responseBody(name: string): string {
    return JSON.stringify(require('./data/testresponse.' + name + '.json'));

}