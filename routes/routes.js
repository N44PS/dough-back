const express = require("express");
const Sheet = require("../utils");
const structureSheet = require("./../sheet.json");

Sheet.init();

var app = express.Router();

app.get("/update", (req, res) => {
    Sheet.getInfo(() => {
        res.send({ status: "success" });
    });
});

app.get("/months", (req, res) => {
    res.send(structureSheet.months);
});

app.get("/cells/:month", async (req, res, next) => {
    try {
        if (!req.params.month) {
            throw new Error("Month missing");
        }
        Sheet.getByMonth(req.params.month).then((data, err) => {
            if (err) res.send({ status: "err", err });
            res.send(data);
        });
    } catch (e) {
        next(e);
    }
});

module.exports = app;
