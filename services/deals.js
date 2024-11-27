const {Bitrix} = require("@2bad/bitrix")
const {logError, logAccess} = require("../logger/logger");

const pageSize = 50;

class DealsService {
    bx;

    constructor(link) {
        this.bx = Bitrix(link);
    }

    async getAllDealsFromSmartProcess(smartProcessId, documentsIdsUserfieldKey) {
        const allResults = [];
        let res;

        let start = 0;
        let total = 0;

        try {
            do {
                res = (await this.bx.call("crm.item.list",
                    {
                        "entityTypeId": smartProcessId,
                        "select": ["id", "title", "createdTime", documentsIdsUserfieldKey],
                        "start": start
                    }
                ))

                total = res.total;
                start += pageSize;

                allResults.push(...res.result.items);
                if (res.total < pageSize) {
                    break;
                }
            } while(start < total);
            return allResults;
        } catch (error) {
            logError("DealsService getAllDealsFromFunnel", error);
            return null;
        }
    }

    async getDealById(smartProcessId, itemId) {
        try {
            return (await this.bx.call("crm.item.get", { "entityTypeId": smartProcessId, "id": itemId })).result;
        } catch (error) {
            logError("DealsService getDealById", error);
        }
    }
}

module.exports = DealsService;