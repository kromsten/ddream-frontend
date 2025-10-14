import { MsgGrant } from '@burnt-labs/xion-types/types/cosmos/authz/v1beta1/tx';
import { MsgExecuteContract } from '@burnt-labs/xion-types/types/cosmwasm/wasm/v1/tx';
import { GenericAuthorization } from '@burnt-labs/xion-types/types/cosmos/authz/v1beta1/authz';

export const sleep = ( ms: number ) => new Promise( resolve => setTimeout( resolve, ms ) );

export const createWasmExecAuthz = (
    contract: string,
    granter: string
) => {
    const authorization = {
        typeUrl: GenericAuthorization.typeUrl,
        value: GenericAuthorization.encode(
            GenericAuthorization.fromPartial({
                msg: MsgExecuteContract.typeUrl
            })
        ).finish()
    };

    const msgGrant = MsgGrant.fromPartial({
      grant: { authorization },
      grantee: contract,
      granter
    });

    const msg = {
      typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
      value: msgGrant
	};

    return msg;
};


