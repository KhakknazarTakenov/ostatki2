const {Bitrix} = require("@2bad/bitrix")
const {logError, logAccess} = require("../logger/logger");

const pageSize = 50;

class DealsService {
    bx;

    constructor(link) {
        this.bx = Bitrix(link);
    }

    async getAllDealsFromFunnel(funnelId, documentsIdsUserfieldKey, cityUserFieldId) {
        const allResults = [];
        let res;

        let start = 0;
        let total = 0;

        try {
            do {
                res = (await this.bx.deals.list(
                    {
                        "filter": { "CATEGORY_ID": funnelId },
                        "select": ["ID", "TITLE", "DATE_CREATE", documentsIdsUserfieldKey, cityUserFieldId],
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

    async getDealById(dealId) {
        try {
            return (await this.bx.deals.get(dealId)).result;
        } catch (error) {
            logError("DealsService getDealById", error);
        }
    }
}

module.exports = DealsService;