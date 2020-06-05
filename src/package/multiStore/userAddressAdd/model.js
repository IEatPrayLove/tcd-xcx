import {
    deleteUserAddressById, getUserAddressById, saveUserAddress
} from "../../service/api";
import {isFunction} from "../../utils/utils";

export default {
    namespace: "userAddressAdd",
    state: {},

    effects: {
        /**
         * 获取用户地址详细信息
         *
         * @param payload
         * @param callback
         * @param call
         * @param put
         */
        * getUserAddressByIdAction({payload, callback}, {call, put}) {
            const res = yield call(getUserAddressById, payload);
            isFunction(callback) && callback(res);
            /*if(res.ok){
                yield put({
                    type:"getConsumerShopOrdersActionResult",
                    payload: res.data
                });
            }*/
        },

        /**
         * 保存用户地址
         *
         * @param payload
         * @param callback
         * @param call
         * @param put
         */
        * saveUserAddressAction({payload, callback}, {call, put}) {
            const res = yield call(saveUserAddress, payload);
            isFunction(callback) && callback(res);
            /*if(res.ok){
                yield put({
                    type:"getConsumerShopOrdersActionResult",
                    payload: res.data
                });
            }*/
        }
    },
    reducers: {

    }
}
