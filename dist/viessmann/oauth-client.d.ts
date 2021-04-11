export interface ViessmannOAuthConfig {
    host: string;
    authorize: string;
    token: string;
    onRefresh?: OnRefresh;
}
export declare type Credentials = UserCredentials | TokenCredentials;
export interface UserCredentials {
    user: string;
    password: string;
}
export interface TokenCredentials {
    refreshToken: string;
}
export declare type OnRefresh = (token: string) => void;
export declare class AuthenticationFailed extends Error {
    readonly message: string;
    constructor(message: string);
}
export declare class RequestFailed extends Error {
    readonly status: any;
    constructor(status: any);
}
export declare class OAuthClient {
    private config;
    private token;
    constructor(config: ViessmannOAuthConfig);
    connect(credentials: Credentials): Promise<OAuthClient>;
    authenticatedGet(uri: string): Promise<any>;
    authenticated(method: string, uri: string, payload: any): Promise<any>;
    private authenticatedWithRetry;
    private getToken;
    private refreshedToken;
    private getInitialToken;
    private isUserCredentials;
    private getAuthorzationCode;
    private authUrl;
    private extractAuthCode;
    private getTokenFromAuthCode;
    private getTokenFromRefreshToken;
    private createCredentials;
}
