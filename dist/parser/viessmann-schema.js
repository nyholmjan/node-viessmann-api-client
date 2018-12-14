"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_optional_1 = require("typescript-optional");
const logger_1 = require("../logger");
const siren_1 = require("./siren");
class SimpleProperty {
    constructor(name, type, value) {
        this.name = name;
        this.type = type;
        this.value = value;
    }
}
exports.SimpleProperty = SimpleProperty;
class ComplexProperty {
    constructor(name, customType, value) {
        this.name = name;
        this.customType = customType;
        this.value = value;
        this.type = 'object';
    }
}
exports.ComplexProperty = ComplexProperty;
class FeatureAction extends siren_1.Action {
    constructor(action) {
        super(action);
    }
    validated(payload) {
        const validationErrors = [];
        this.fields.forEach(field => {
            this.validateField(field, payload).ifPresent(error => validationErrors.push(error));
        });
        if (validationErrors.length !== 0) {
            logger_1.log(`FeatureAction[${this.name}]: validation failed: ${JSON.stringify(validationErrors)}`, 'warn');
            return typescript_optional_1.default.empty();
        }
        return typescript_optional_1.default.of(this);
    }
    validateField(field, payload) {
        logger_1.log(`FeatureAction[${this.name}]: validating field ${field.name}`, 'debug');
        if (payload === undefined) {
            return typescript_optional_1.default.of(`Field[${field.name}]: no payload`);
        }
        const value = payload[field.name];
        if (value === undefined && field.required) {
            return typescript_optional_1.default.of(`Field[${field.name}]: required but not found`);
        }
        if (value !== undefined && field.type !== typeof value) {
            return typescript_optional_1.default.of(`Field[${field.name}]: required type ${field.type} but was ${typeof value}`);
        }
        return typescript_optional_1.default.empty();
    }
}
exports.FeatureAction = FeatureAction;
class SirenFeature {
    constructor(meta, entity) {
        this.meta = meta;
        const raw = entity.properties;
        let properties = [];
        if ('object' === typeof raw) {
            properties = Object
                .keys(raw)
                .map(key => constructProperty(key, raw[key]))
                .filter(p => p.isPresent)
                .map(p => p.get());
        }
        this.properties = properties;
        this.actions = entity.actions.map(a => new FeatureAction(a));
    }
    static of(entity) {
        const meta = getMetaInformation(entity);
        return meta.map(m => new SirenFeature(m, entity));
    }
    static createFeatures(entity, enabledOnly = true) {
        const result = new Map();
        selectLeafFeaturesOf(entity)
            .map(e => {
            const meta = getMetaInformation(e);
            return meta.map(m => new SirenFeature(m, e)).orElse(null);
        }).filter(f => {
            return (f !== null && (!enabledOnly || f.meta.isEnabled));
        })
            .forEach(f => result.set(f.meta.feature, f));
        return result;
    }
    getProperty(name) {
        const result = this.properties.find(p => name === p.name);
        return typescript_optional_1.default.ofNullable(result);
    }
    getAction(name) {
        const result = this.actions.find(a => name === a.name);
        return typescript_optional_1.default.ofNullable(result);
    }
}
exports.SirenFeature = SirenFeature;
function getMetaInformation(entity) {
    if (!isFeature(entity)) {
        return typescript_optional_1.default.empty();
    }
    const result = entity.entities
        .filter(e => e.rel.indexOf('http://schema.viessmann.com/link-relations#feature-meta-information') > -1)
        .map(e => e.properties)
        .filter(m => m.apiVersion !== undefined
        && m.isEnabled !== undefined
        && m.isReady !== undefined
        && m.gatewayId !== undefined
        && m.feature !== undefined
        && m.uri !== undefined
        && m.deviceId !== undefined)[0];
    return typescript_optional_1.default.ofNullable(result);
}
function selectLeafFeaturesOf(entity) {
    const grandChildren = entity.entities.map(e => selectLeafFeaturesOf(e));
    const leafs = flatten(grandChildren, []);
    if (isFeatureWithProperties(entity)) {
        leafs.push(entity);
    }
    return leafs;
}
function isFeature(entity) {
    return entity.hasClass('feature');
}
function isFeatureWithProperties(entity) {
    return isFeature(entity) && hasProperties(entity);
}
function hasProperties(entity) {
    if (entity.properties === undefined
        || 'object' !== typeof entity.properties
        || Object.keys(entity.properties).length === 0) {
        return false;
    }
    const propertyNames = Object.keys(entity.properties);
    if (propertyNames.indexOf('components') > -1) {
        return false;
    }
    return true;
}
const simpleTypes = ['string', 'number', 'boolean', 'array'];
function constructProperty(name, raw) {
    if (raw === undefined || raw === null || 'object' !== typeof raw) {
        return typescript_optional_1.default.empty();
    }
    const type = raw.type;
    const value = raw.value;
    if (type === undefined || value === undefined) {
        return typescript_optional_1.default.empty();
    }
    if (simpleTypes.indexOf(type) > -1) {
        return typescript_optional_1.default.of(new SimpleProperty(name, type, value));
    }
    return typescript_optional_1.default.of(new ComplexProperty(name, type, value));
}
function flatten(arr, result = []) {
    for (let i = 0, length = arr.length; i < length; i++) {
        const value = arr[i];
        if (value !== undefined) {
            if (Array.isArray(value)) {
                flatten(value, result);
            }
            else {
                result.push(value);
            }
        }
    }
    return result;
}
//# sourceMappingURL=viessmann-schema.js.map