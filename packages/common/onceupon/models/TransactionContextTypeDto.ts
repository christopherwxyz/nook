/* tslint:disable */
/* eslint-disable */
/**
 * Once Upon
 * API documentation
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime';
import type { ContextOutcomeTypeDto } from './ContextOutcomeTypeDto';
import {
    ContextOutcomeTypeDtoFromJSON,
    ContextOutcomeTypeDtoFromJSONTyped,
    ContextOutcomeTypeDtoToJSON,
} from './ContextOutcomeTypeDto';

/**
 * 
 * @export
 * @interface TransactionContextTypeDto
 */
export interface TransactionContextTypeDto {
    /**
     * Type of the context
     * @type {string}
     * @memberof TransactionContextTypeDto
     */
    type?: string;
    /**
     * Category of the context
     * @type {string}
     * @memberof TransactionContextTypeDto
     */
    category?: TransactionContextTypeDtoCategoryEnum;
    /**
     * Outcomes of the context
     * @type {Array<ContextOutcomeTypeDto>}
     * @memberof TransactionContextTypeDto
     */
    outcomes?: Array<ContextOutcomeTypeDto>;
    /**
     * Cross-chain transactions
     * @type {Array<Array<string>>}
     * @memberof TransactionContextTypeDto
     */
    crossChainTx?: Array<Array<string>>;
}


/**
 * @export
 */
export const TransactionContextTypeDtoCategoryEnum = {
    Multichain: 'MULTICHAIN',
    FungibleToken: 'FUNGIBLE_TOKEN',
    Nft: 'NFT',
    Identity: 'IDENTITY',
    Core: 'CORE',
    Other: 'OTHER',
    Dev: 'DEV',
    Unknown: 'UNKNOWN'
} as const;
export type TransactionContextTypeDtoCategoryEnum = typeof TransactionContextTypeDtoCategoryEnum[keyof typeof TransactionContextTypeDtoCategoryEnum];


/**
 * Check if a given object implements the TransactionContextTypeDto interface.
 */
export function instanceOfTransactionContextTypeDto(value: object): boolean {
    return true;
}

export function TransactionContextTypeDtoFromJSON(json: any): TransactionContextTypeDto {
    return TransactionContextTypeDtoFromJSONTyped(json, false);
}

export function TransactionContextTypeDtoFromJSONTyped(json: any, ignoreDiscriminator: boolean): TransactionContextTypeDto {
    if (json == null) {
        return json;
    }
    return {
        
        'type': json['type'] == null ? undefined : json['type'],
        'category': json['category'] == null ? undefined : json['category'],
        'outcomes': json['outcomes'] == null ? undefined : ((json['outcomes'] as Array<any>).map(ContextOutcomeTypeDtoFromJSON)),
        'crossChainTx': json['crossChainTx'] == null ? undefined : json['crossChainTx'],
    };
}

export function TransactionContextTypeDtoToJSON(value?: TransactionContextTypeDto | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'type': value['type'],
        'category': value['category'],
        'outcomes': value['outcomes'] == null ? undefined : ((value['outcomes'] as Array<any>).map(ContextOutcomeTypeDtoToJSON)),
        'crossChainTx': value['crossChainTx'],
    };
}
