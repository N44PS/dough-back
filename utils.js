const asyncFn = require("async");
const GoogleSpreadsheet = require("google-spreadsheet");
const structureSheet = require("./sheet.json");

const SPREADSHEET_KEY = process.env.SPREADSHEET_KEY;
const CREDENTIALS = {
  client_email: process.env.CLIENT_EMAIL,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
};

const util = require('util');

module.exports = GOOGLESHEET = {
  doc: null,
  sheet: null,
  cells: [],

  init: () => {
    console.log("Sheet::init");
    GOOGLESHEET.doc = new GoogleSpreadsheet(SPREADSHEET_KEY);
    asyncFn.series([
      step => {
        console.log("Sheet::getDoc");
        GOOGLESHEET.doc.useServiceAccountAuth(CREDENTIALS, step);
      },
      step => {
        GOOGLESHEET.getInfo();
      }
    ]);
  },

  getInfo: (cb = () => { }) => {
    console.log("Sheet::getInfo");
    GOOGLESHEET.doc.getInfo(function (err, info) {
      console.log("Loaded doc: " + info.title + " by " + info.author.email);
      GOOGLESHEET.sheet = info.worksheets[0];
      console.log(
        "sheet 1: " +
        GOOGLESHEET.sheet.title +
        " " +
        GOOGLESHEET.sheet.rowCount +
        "x" +
        GOOGLESHEET.sheet.colCount
      );
      cb();
    });
  },

  getTotalExpensesByMonth: month => {
    return new Promise((resolve, reject) => {
      const options = {
        "min-row": structureSheet.categoriesTotalRow,
        "max-row": structureSheet.categoriesTotalRow,
        "min-col": month,
        "max-col": month,
        "return-empty": true
      };
      GOOGLESHEET.sheet.getCells(options, (err, cells) => {
        if (err) {
          reject({ status: "error", err });
        } else {
          resolve(cells.map(cell => cell.value || "0")[0]);
        }
      });
    });
  },

  getCells: month => {
    const categories = structureSheet.categories;
    return new Promise((resolve, reject) => {
      const options = {
        "min-col": month,
        "max-col": month,
        "return-empty": true
      };
      GOOGLESHEET.sheet.getCells(options, (err, cells) => {
        if (err) {
          reject({ status: "error", err });
        } else {
          const results = categories.map(category => {
            const { id, label, isExpenses } = category;
            const entries = getEntries(category.ranges, cells);
            const total = entries.pop();
            return { id, label, isExpenses, entries, total: total.value };
          });
          resolve(results);
        }
      });
    });
  },

  getByMonth: async month => {
    GOOGLESHEET.cells = [];
    return await Promise.all([
      GOOGLESHEET.getCells(month),
      GOOGLESHEET.getTotalExpensesByMonth(month)
    ]).then(results => ({ categories: results[0], totalExpenses: results[1] }));
  },

  updateCell: (batchId, value, method) => {
    return new Promise((resolve, reject) => {
      const cell = GOOGLESHEET.cells.find(cell => cell.batchId === batchId);
      if (!cell) {
        reject({ status: "error", err: "Couldn't find cell" });
      } else {
        console.log("updateCell", batchId, value, method);
        console.log(cell.value);
        //cell.value = value;
        // commenting this just in case. Please modify R18C2 only for tests
        // cell.save(_ => {
        // Check what to send back properly
        // resolve({ cell, batchId, value });
        //});
        resolve(true);
      }
    });
  }
};

const getEntries = (ranges, cells) => {
  return cells
    .filter(cell => cell.row >= ranges[0] && cell.row <= ranges[1] + 1)
    .map(cell => {
      const { row, batchId, numericValue, value } = cell;
      GOOGLESHEET.cells.push(cell);
      const rowItem = structureSheet.rows.find(r => r.rowId == row);
      return {
        label: rowItem ? rowItem.label : "Total",
        id: batchId,
        value: value || "0",
        numericValue: numericValue || 0
      };
    });
};
