"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const blakejs = __importStar(require("blakejs"));
const TezosTypes = __importStar(require("../../../types/tezos/TezosChainTypes"));
const TezosConstants_1 = require("../../../types/tezos/TezosConstants");
const TezosNodeWriter_1 = require("../TezosNodeWriter");
const TezosNodeReader_1 = require("../TezosNodeReader");
var BabylonDelegationHelper;
(function (BabylonDelegationHelper) {
    function verifyDestination(server, address) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = yield TezosNodeReader_1.TezosNodeReader.getAccountForBlock(server, 'head', address);
            if (!!!contract.script) {
                throw new Error(`No code found at ${address}`);
            }
            const k = Buffer.from(blakejs.blake2s(contract['script'].toString(), null, 16)).toString('hex');
            if (k !== '023fc21b332d338212185c817801f288') {
                throw new Error(`Contract at ${address} does not match the expected code hash`);
            }
            return true;
        });
    }
    BabylonDelegationHelper.verifyDestination = verifyDestination;
    function setDelegate(server, keyStore, contract, delegate, fee, derivationPath = '') {
        if (contract.startsWith('KT1')) {
            const parameters = `[{ "prim": "DROP" }, { "prim": "NIL", "args": [{ "prim": "operation" }] }, { "prim": "PUSH", "args": [{ "prim": "key_hash" }, { "string": "${delegate}" } ] }, { "prim": "SOME" }, { "prim": "SET_DELEGATE" }, { "prim": "CONS" } ]`;
            return TezosNodeWriter_1.TezosNodeWriter.sendContractInvocationOperation(server, keyStore, contract, 0, fee, derivationPath, 0, TezosConstants_1.TezosConstants.P005ManagerContractWithdrawalGasLimit, 'do', parameters, TezosTypes.TezosParameterFormat.Micheline);
        }
        else {
            return TezosNodeWriter_1.TezosNodeWriter.sendDelegationOperation(server, keyStore, delegate, fee, derivationPath);
        }
    }
    BabylonDelegationHelper.setDelegate = setDelegate;
    function unSetDelegate(server, keyStore, contract, fee, derivationPath = '') {
        if (contract.startsWith('KT1')) {
            const parameters = `[{ "prim": "DROP" }, { "prim": "NIL", "args": [{ "prim": "operation" }] }, { "prim": "NONE", "args": [{ "prim": "key_hash" }] }, { "prim": "SET_DELEGATE" }, { "prim": "CONS" } ]`;
            return TezosNodeWriter_1.TezosNodeWriter.sendContractInvocationOperation(server, keyStore, contract, 0, fee, derivationPath, 0, TezosConstants_1.TezosConstants.P005ManagerContractWithdrawalGasLimit, 'do', parameters, TezosTypes.TezosParameterFormat.Micheline);
        }
        else {
            return TezosNodeWriter_1.TezosNodeWriter.sendUndelegationOperation(server, keyStore, fee, derivationPath);
        }
    }
    BabylonDelegationHelper.unSetDelegate = unSetDelegate;
    function withdrawDelegatedFunds(server, keyStore, contract, fee, amount, derivationPath = '') {
        return sendDelegatedFunds(server, keyStore, contract, fee, amount, derivationPath, keyStore.publicKeyHash);
    }
    BabylonDelegationHelper.withdrawDelegatedFunds = withdrawDelegatedFunds;
    function sendDelegatedFunds(server, keyStore, contract, fee, amount, derivationPath = '', destination) {
        let parameters = `[ { "prim": "DROP" },
            { "prim": "NIL", "args": [ { "prim": "operation" } ] },
            { "prim": "PUSH", "args": [ { "prim": "key_hash" }, { "string": "${destination}" } ] },
            { "prim": "IMPLICIT_ACCOUNT" },
            { "prim": "PUSH", "args": [ { "prim": "mutez" }, { "int": "${amount}" } ] },
            { "prim": "UNIT" },
            { "prim": "TRANSFER_TOKENS" },
            { "prim": "CONS" } ]`;
        return TezosNodeWriter_1.TezosNodeWriter.sendContractInvocationOperation(server, keyStore, contract, 0, fee, derivationPath, TezosConstants_1.TezosConstants.P005ManagerContractWithdrawalStorageLimit, TezosConstants_1.TezosConstants.P005ManagerContractWithdrawalGasLimit, 'do', parameters, TezosTypes.TezosParameterFormat.Micheline);
    }
    BabylonDelegationHelper.sendDelegatedFunds = sendDelegatedFunds;
    function depositDelegatedFunds(server, keyStore, contract, fee, amount, derivationPath = '') {
        return TezosNodeWriter_1.TezosNodeWriter.sendContractInvocationOperation(server, keyStore, contract, amount, fee, derivationPath, 0, TezosConstants_1.TezosConstants.P005ManagerContractDepositGasLimit, undefined, undefined);
    }
    BabylonDelegationHelper.depositDelegatedFunds = depositDelegatedFunds;
    function deployManagerContract(server, keyStore, delegate, fee, amount, derivationPath = '') {
        const code = `[ { "prim": "parameter",
        "args":
          [ { "prim": "or",
              "args":
                [ { "prim": "lambda",
                    "args":
                      [ { "prim": "unit" }, { "prim": "list", "args": [ { "prim": "operation" } ] } ], "annots": [ "%do" ] },
                  { "prim": "unit", "annots": [ "%default" ] } ] } ] },
      { "prim": "storage", "args": [ { "prim": "key_hash" } ] },
      { "prim": "code",
        "args":
          [ [ [ [ { "prim": "DUP" }, { "prim": "CAR" },
                  { "prim": "DIP", "args": [ [ { "prim": "CDR" } ] ] } ] ],
              { "prim": "IF_LEFT",
                "args":
                  [ [ { "prim": "PUSH", "args": [ { "prim": "mutez" }, { "int": "0" } ] },
                      { "prim": "AMOUNT" },
                      [ [ { "prim": "COMPARE" }, { "prim": "EQ" } ],
                        { "prim": "IF", "args": [ [], [ [ { "prim": "UNIT" }, { "prim": "FAILWITH" } ] ] ] } ],
                      [ { "prim": "DIP", "args": [ [ { "prim": "DUP" } ] ] },
                        { "prim": "SWAP" } ],
                      { "prim": "IMPLICIT_ACCOUNT" },
                      { "prim": "ADDRESS" },
                      { "prim": "SENDER" },
                      [ [ { "prim": "COMPARE" }, { "prim": "EQ" } ],
                        { "prim": "IF", "args": [ [], [ [ { "prim": "UNIT" },{ "prim": "FAILWITH" } ] ] ] } ],
                      { "prim": "UNIT" }, { "prim": "EXEC" },
                      { "prim": "PAIR" } ],
                    [ { "prim": "DROP" },
                      { "prim": "NIL", "args": [ { "prim": "operation" } ] },
                      { "prim": "PAIR" } ] ] } ] ] } ]`;
        const storage = `{ "string": "${keyStore.publicKeyHash}" }`;
        return TezosNodeWriter_1.TezosNodeWriter.sendContractOriginationOperation(server, keyStore, amount, delegate, fee, derivationPath, 600, 20000, code, storage, TezosTypes.TezosParameterFormat.Micheline);
    }
    BabylonDelegationHelper.deployManagerContract = deployManagerContract;
})(BabylonDelegationHelper = exports.BabylonDelegationHelper || (exports.BabylonDelegationHelper = {}));
//# sourceMappingURL=BabylonDelegationHelper.js.map