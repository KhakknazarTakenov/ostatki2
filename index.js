const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const dotenv = require('dotenv');
const path = require("path");
const timeout = require("connect-timeout");

const {logAccess, logError} = require("./logger/logger");
const Db = require("./services/db");
const {encryptText, decryptText} = require("./services/crypt");

const DealsService = require("./services/deals");

const {appendFileSync} = require("node:fs");
const {all} = require("express/lib/application");
const dealService = require("./services/db");

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = 2354;

const BASE_URL = "/ostatki_two/"

const db = new Db();
db.createTables();

app.use(cors({
    origin: "*",
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(timeout('20m'));

function haltOnTimedOut(req, res, next) {
    if (!req.timedout) next();
}

const documentsIdsUserfieldKey = "ufCrm24_1732694625717";
const smartProcessId = 1040;

app.post(BASE_URL+"get_deals_from_bx_insert_in_db/", async (req, res) => {
    try {
        const smartProcessId = req.body.smart_process_id;

        const db = new Db();
        const bxLinkDecrypted = await decryptText(process.env.BX_LINK);
        const dealsService = new DealsService(bxLinkDecrypted);

        const deals = (await dealsService.getAllDealsFromSmartProcess(smartProcessId, documentsIdsUserfieldKey)).map(deal => {
            return {
                id: deal["id"],
                title: deal["title"],
                date_create: deal["createdTime"].replace(/T.*/, ""),
                documents_ids: deal[documentsIdsUserfieldKey]
            }
        }).filter(deal => deal !== null);
        if (await db.insertDeals(deals)) {
            logAccess(BASE_URL+"get_deals_from_bx_insert_in_db/", `Deals from ${smartProcessId} smart process successfully added to DB`);
        } else {
            throw new Error(`Error while adding deals from ${smartProcessId} to DB`)
        }

        res.status(200).json({"status": true, "status_msg": "success", "message": `Deals from ${smartProcessId} funnel successfully added to DB`});

    } catch (error) {
        logError(BASE_URL+"get_deals_from_bx/", error);
        res.status(500).json({"status": false, "status_msg": "error", "message": "server error"});
    }
})

app.post(BASE_URL+"get_deals_from_db/", async (req, res) => {
    try {
        const db = new Db();

        const deals = await db.getDeals();

        res.status(200).json({"status": true, "status_msg": "success", "deals": deals});
    } catch (error) {
        logError(BASE_URL+"get_deals_from_bx/", error);
        res.status(500).json({"status": false, "status_msg": "error", "message": "server error"});
    }
})

app.post(BASE_URL+"add_deal_handler/", async (req, res) => {
    try {
        let id = req.query["ID"];
        if (!id) {
            id = req.body["data[FIELDS][ID]"];
        }
        if (!id) {
            logError(BASE_URL+"add_deal_handler", "No deal id provided")
            res.status(400).json({"status": false, "status_msg": "error", "message": "No deal id provided"});
            return;
        }

        const bxLinkDecrypted = await decryptText(process.env.BX_LINK);

        const db = new Db();
        const dealService = new DealsService(bxLinkDecrypted);

        const newDeal = [(await dealService.getDealById(smartProcessId, id))].map(deal => {
            return {
                id: deal["id"],
                title: deal["title"],
                date_create: deal["createdTime"],
                documents_ids: deal[documentsIdsUserfieldKey],
            }
        }).filter(deal => deal !== null);

        if(await db.insertDeals(newDeal)) {
            logAccess(BASE_URL+"add_deal_handler/", `Deal ${id} successfully added to DB`);
            res.status(200).json({"status": true, "status_msg": "success", "message": `Deal ${id} successfully added to DB`});
        } else {
            throw new Error(`Error while adding deal ${id} to DB`);
        }
    } catch (error) {
        logError(BASE_URL+"add_deal_handler/", error);
        res.status(500).json({"status": false, "status_msg": "error", "message": "server error"});
    }
})

app.post(BASE_URL+"update_deal_handler/", async (req, res) => {
    try {
        let id = req.query["ID"];
        if (!id) {
            id = req.body["data[FIELDS][ID]"];
        }
        if (!id) {
            logError(BASE_URL+"update_deal_handler", "No deal id provided")
            res.status(400).json({"status": false, "status_msg": "error", "message": "No deal id provided"});
            return;
        }

        const bxLinkDecrypted = await decryptText(process.env.BX_LINK);

        const db = new Db();
        const dealService = new DealsService(bxLinkDecrypted);

        const newDeal = [(await dealService.getDealById(id))].map(deal => {
            if (Number(deal["CATEGORY_ID"]) !== funnelId) {
                return null;
            }
            return {
                id: deal["ID"],
                title: deal["TITLE"],
                date_create: deal["DATE_CREATE"],
                documents_ids: deal[documentsIdsUserfieldKey],
            }
        }).filter(deal => deal !== null);

        if(await db.updateDealById(id, newDeal[0])) {
            logAccess(BASE_URL+"update_deal_handler/", `Deal ${id} successfully added to DB`);
            res.status(200).json({"status": true, "status_msg": "success", "message": `Deal ${id} successfully added to DB`});
        } else {
            throw new Error(`Error while adding deal ${id} to DB`);
        }
    } catch (error) {
        logError(BASE_URL+"add_deal_handler/", error);
        res.status(500).json({"status": false, "status_msg": "error", "message": "server error"});
    }
})

app.post(BASE_URL+"delete_deal_handler/", async (req, res) => {
    try {
        let id = req.query["ID"];
        if (!id) {
            id = req.body["data[FIELDS][ID]"];
        }
        if (!id) {
            logError(BASE_URL+"delete_deal_handler", "No deal id provided")
            res.status(400).json({"status": false, "status_msg": "error", "message": "No deal id provided"});
            return;
        }

        const db = new Db();
        if (db.deleteDealById(id)) {
            logAccess(BASE_URL+"add_deal_handler/", `Deal ${id} successfully deleted from DB`);
            res.status(200).json({"status": true, "status_msg": "success", "message": `Deal ${id} successfully deleted from DB`});
        } else {
            throw new Error(`Error while deleting deal ${id} from DB`);
        }
    } catch (error) {
        logError(BASE_URL+"delete_deal_handler/", error);
        res.status(500).json({"status": false, "status_msg": "error", "message": "server error"});
    }
})

app.post(BASE_URL+"test/", async (req, res) => {
    const db = new Db();
})

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});