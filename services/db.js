const {logError, logAccess} = require("../logger/logger");
const path = require("path");
const sqlite3 = require('sqlite3').verbose();

class Db {
    dbPath = path.resolve(__dirname, '../db/database.db');

    createTables() {
        const db = new sqlite3.Database(this.dbPath);
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS deals (
                    id INTEGER PRIMARY KEY,  
                    title TEXT,
                    date_create DATE,
                    documents_ids TEXT,
                    city_field_value TEXT
                );
            `);
        });

        db.close();
    }

    insertDeals(deals) {
        const db = new sqlite3.Database(this.dbPath);
        return new Promise((resolve) => {
            try {
                db.serialize(() => {
                    const stmt = db.prepare(`
                    INSERT OR REPLACE INTO deals (id, title, date_create, documents_ids, city_field_value) VALUES (?, ?, ?, ?, ?);
                `);

                    deals.forEach((deal) => {
                        stmt.run(deal.id, deal.title, deal.date_create, deal.documents_ids, deal.city, (res, err) => {
                            if (err) {
                                logError("DB service insertDeals run", err)
                            }
                        });
                    });

                    stmt.finalize();
                });
                resolve(true);
            } catch (error) {
                logError("DB service insertDeals", error);
                resolve(false)
            } finally {
                db.close();
            }
        })
    }

    getDeals() {
        const db = new sqlite3.Database(this.dbPath);
        return new Promise((resolve, reject) => {
            try {
                db.all(`SELECT * FROM deals`, (err, rows) => {
                    if (err) {
                        logError("DB service getDeals", err);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            } catch (error) {
                logError("DB service getDeals", error);
                reject(error);
            } finally {
                db.close();
            }
        });
    }

    getDealById(id) {
        const db = new sqlite3.Database(this.dbPath);
        return new Promise((resolve, reject) => {
            try {
                db.get(`SELECT * FROM deals WHERE id = ?`, [id], (err, row) => {
                    if (err) {
                        logError("DB service getDealById", err);
                        reject(err);
                    }
                    if (row) {
                        resolve(row);
                    }
                });
            } catch (error) {
                logError("DB service getDealById", error);
                resolve(false);
            } finally {
                db.close()
            }
        })
    }

    updateDealById(id, updatedFields = {}) {
        const db = new sqlite3.Database(this.dbPath);
        return new Promise((resolve, reject) => {
            try {
                // Constructing dynamic SQL based on which fields are passed in updatedFields
                const fieldsToUpdate = [];
                const values = [];

                if (updatedFields.title) {
                    fieldsToUpdate.push("title = ?");
                    values.push(updatedFields.title);
                }
                if (updatedFields.date_create) {
                    fieldsToUpdate.push("date_create = ?");
                    values.push(updatedFields.date_create);
                }
                if (updatedFields.documents_ids) {
                    fieldsToUpdate.push("documents_ids = ?");
                    values.push(updatedFields.documents_ids);
                }

                if (fieldsToUpdate.length === 0) {
                    throw new Error("No fields to update");
                }

                // Add the id at the end of values array for the WHERE clause
                values.push(id);

                const sql = `
                UPDATE deals
                SET ${fieldsToUpdate.join(", ")}
                WHERE id = ?
            `;

                db.serialize(() => {
                    db.run(sql, values, (err) => {
                        if (err) {
                            logError("DB service updateDealById", err);
                            reject(false);
                        }
                        logAccess("DB Service updateDealById", `Deal with id ${id} updated successfully.`);
                    });
                });
                resolve(true);
            } catch (error) {
                logError("DB service updateDealById", error);
                resolve(false);
            } finally {
                db.close();
            }
        })
    }

    deleteDealById(id) {
        const db = new sqlite3.Database(this.dbPath);
        try {
            db.serialize(() => {
                db.run(`DELETE FROM deals WHERE id = ?`, [id], (err) => {
                    if (err) {
                        logError("DB service deleteDealById", err);
                        return false;
                    }
                    logAccess("DB Service deleteDealById", `Deal with id ${id} deleted.`);
                });
            });
            return true;
        } finally {
            db.close();
        }
    }

    clearDealsTable() {
        const db = new sqlite3.Database(this.dbPath);
        try {
            db.serialize(() => {
                db.run(`DELETE FROM deals`, (err) => {
                    if (err) {
                        logError("DB service deleteDealById", err);
                        return false;
                    }
                    logAccess("DB Service deleteDealById", `Deals table cleared.`);
                });
            });
            return true;
        } finally {
            db.close();
        }
    }
}

module.exports = Db;