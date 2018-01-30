const asyncFn = require("async");
const GoogleSpreadsheet = require("google-spreadsheet");
const structureSheet = require("./sheet.json");

const SPREADSHEET_KEY = process.env.SPREADSHEET_KEY;
const CREDENTIALS = {
  client_email: process.env.CLIENT_EMAIL,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
};

module.exports = GOOGLESHEET = {
  doc: null,
  sheet: null,

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

  getInfo: (cb = () => {}) => {
    console.log("Sheet::getInfo");
    GOOGLESHEET.doc.getInfo(function(err, info) {
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

  getCellsByRange: (category, month) => {
    return new Promise((resolve, reject) => {
      const options = {
        "min-row": category.ranges[0],
        "max-row": category.ranges[1],
        "min-col": month,
        "max-col": month,
        "return-empty": true
      };
      GOOGLESHEET.sheet.getCells(options, (err, cells) => {
        if (err) {
          reject({ status: "error", err });
        } else {
          const { id, label, isExpenses } = category;
          const entries = cells.map(cell => {
            const { row, batchId, numericValue, value } = cell;
            return {
              label: structureSheet.rows.find(r => r.rowId == row).label,
              id: batchId,
              value: value || "0",
              numericValue: numericValue || 0
            };
          });
          const res = { id, label, isExpenses, entries };
          resolve(res);
        }
      });
    });
  },

  getByMonth: async month => {
    return await Promise.all(
      structureSheet.categories.map(async category => {
        return await GOOGLESHEET.getCellsByRange(category, month);
      })
    );
  }
};
