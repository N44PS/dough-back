const express = require("express");
const Sheet = require("./utils");
const structureSheet = require("./sheet.json");

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
            res.status(401).json({ error: "Month missing" });
        }
        Sheet.getByMonth(req.params.month).then((data, err) => {
            if (err) res.status(401).send({ status: "err", err });
            res.status(200).json(data);
        });
    } catch (e) {
        next(e);
    }
});

app.put("/cell/:id", async (req, res, next) => {
    try {
        if (!req.params.id) {
            res.status(401).json({ error: "BatchId missing" });
        }
        if (!req.body.method) {
            res.status(401).json({ error: "Method missing" });
        }
        if (!req.body.value) {
            res.status(401).json({ error: "Value missing" });
        }
        Sheet.updateCell(req.params.id, req.body.value, req.body.method).then((data, err) => {
            if (err) res.send({ status: "err", err });
            res.status(200).json(data);
        });
    } catch (e) {
        next(e);
    }
});

module.exports = app;
