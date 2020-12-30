"use strict";

require("../../env");

const mongoose = require("mongoose");
const config = require("../../config");
const modelsName = [
  "users",
  "chats",
  "games",
  "game_players",
  "supports",
  "transactions",
  "faqs",
  // "settings",
  "bots",
  "wallets",
  "refer_friends",
  "packages",
  "investments",
  "statisticals",
  "requests",
  "game_profits",
  "commissions",
  "commissions_leaders",
  // "coefficients",
]

// Boostrap models
require(config.PATH_MODELS)
  .map(modelName => `${config.PATH_MODELS}/${modelName}`)
  .forEach(require);

// utils
const firstUpperCase = str => str[0].toUpperCase() + str.substr(1);
const mixString = ch => str => str.split(ch).map(firstUpperCase).join("");

const getModels = () =>
  modelsName
    .map(mixString("_"))
    .map(str => str.slice(0, -1))
    .map(modelName => mongoose.model(modelName));

const cleanDB = db =>
  new Promise((rs, rj) =>
    db.deleteMany({}).then(_ => db.collection.drop().then(rs).catch(rs))
  );
const migrateDB = db =>
  db.insertMany(db.getMigrateData ? db.getMigrateData() : []);

const cleanDBs = DBs => Promise.all(DBs.map(cleanDB));
const migrateDBs = DBs => Promise.all(DBs.map(migrateDB));

const connect = () =>
  new Promise((resolve, reject) => {
    mongoose.set("useCreateIndex", true);
    mongoose.connect(config.DATABASE.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const db = mongoose.connection;
    db.on("error", () => reject("Please install and start your mongodb"));
    db.once("open", resolve);
  });
const migrate = (req, res) => {
  console.log("migrate");
  connect()
    .then(() => {
      cleanDBs(getModels())
        .then(() => {
          return migrateDBs(getModels());
        })
        .then(() => {
          console.log(
            "Database " + config.DATABASE.DATABASE_NAME + " refreshed"
          );

          // console.log(req.header,"???");
          // res.end("All DB is migrated");
          // res.redirect("back");
        })
        .catch(er => {
          console.log(er.message || "ERROR when migrate");
          // process.exit(0);
        });
    })
    .catch(er => {
      console.log(er);
      process.exit(0);
    });

  process.on("uncaughtException", err => {
    console.log("server.js line 63 ERROR: ", err.message);
  });

  process.on("unhandledRejection", err => {
    console.log(err.message);
  });
};

module.exports = {
  migrate
};
