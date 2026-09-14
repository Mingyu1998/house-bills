/**
 * House bills — Google Sheet backend.
 *
 * Deploy this with Deploy > New deployment > Web app, and:
 *     Execute as:      Me
 *     Who has access:  Anyone
 * Copy the /exec URL it gives you and put it in the page.
 *
 * The Sheet is the database. Two tabs are created and kept in step with the
 * page, so you can read and edit the figures in the Sheet as well, and Google's
 * own version history tracks every change.
 *
 * The two settings below stay in your Apps Script project only. The copy of
 * this file in the public repository leaves both empty on purpose.
 *
 * SHEET_ID — two ways to set this up, and only one of them needs it.
 *
 *   Bound script — you opened the Sheet and chose Extensions > Apps Script.
 *     The script belongs to that Sheet. Leave SHEET_ID empty.
 *
 *   Standalone script — you started at script.google.com. The script belongs
 *     to nothing, so getActiveSpreadsheet() returns null and every request
 *     fails. Paste the Sheet's id into SHEET_ID.
 *
 *   The id is the long string in the Sheet's own URL, between /d/ and /edit:
 *     docs.google.com/spreadsheets/d/THIS_PART_HERE/edit
 *
 *   A spreadsheet still in Excel (.xlsx) format cannot host a bound script and
 *   cannot be opened by id either. If yours came from an uploaded .xlsx, open
 *   it and choose File > Save as Google Sheets first, then use the new file's id.
 *
 * PASSPHRASE — the /exec URL is necessarily visible in the page's source, so on
 *   its own it would let anyone who finds it read the names and figures. With a
 *   passphrase set, the script answers nothing without it; the page asks each
 *   person for it once per device. Share it with the house privately.
 *   Leave it empty and anyone holding the /exec URL can read and write.
 *
 * After changing anything here: Deploy > Manage deployments > edit (pencil) >
 * Version: New version > Deploy. Saving alone does not change what /exec serves.
 */

var SHEET_ID = '';     // leave empty for a bound script; see above
var PASSPHRASE = '';   // strongly recommended; see above

var COSTS = 'Costs';
var NIGHTS = 'Nights';
var COST_HEAD = ['Month', 'Item', 'Paid by', 'Amount', 'Split'];
var NIGHT_HEAD = ['Month', 'Person', 'Nights'];

function allowed_(key) {
  return !PASSPHRASE || String(key == null ? '' : key) === PASSPHRASE;
}

function book_() {
  var ss = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      'No spreadsheet to write to. This script is not attached to a Sheet, so ' +
      'set SHEET_ID at the top of Code.gs to the id in your Sheet URL, then ' +
      'redeploy with Deploy > Manage deployments.');
  }
  return ss;
}

function sheetFor_(name, head) {
  var ss = book_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function readRows_(name, head) {
  var sh = sheetFor_(name, head);
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, head.length).getValues()
           .filter(function (r) { return String(r[0]).length > 0; });
}

function writeRows_(name, head, rows) {
  var sh = sheetFor_(name, head);
  // A month key like "Sep-26" is a date as far as Sheets is concerned: left
  // alone it stores 26 September and hands back a timestamp, which no longer
  // matches the key the page wrote, so the page discards the row on reload.
  // Forcing the Month column to plain text keeps the key intact.
  sh.getRange(1, 1, sh.getMaxRows(), 1).setNumberFormat('@');
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, head.length).clearContent();
  if (rows.length) {
    var body = rows.map(function (r) {
      var out = [];
      for (var i = 0; i < head.length; i++) out.push(r[i] === undefined ? '' : r[i]);
      return out;
    });
    sh.getRange(2, 1, body.length, head.length).setValues(body);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this once from the Apps Script editor (choose checkSetup and press Run)
 * to confirm the script can reach the Sheet before you bother deploying.
 * The answer appears in the execution log.
 */
function checkSetup() {
  var ss = book_();
  Logger.log('Connected to: ' + ss.getName());
  Logger.log('Tabs: ' + ss.getSheets().map(function (s) { return s.getName(); }).join(', '));
  Logger.log('Passphrase: ' + (PASSPHRASE ? 'set' : 'NOT set — anyone with the /exec URL can read and write'));
  return ss.getName();
}

function doGet(e) {
  if (!allowed_(e && e.parameter ? e.parameter.key : '')) return json_({ locked: true });
  try {
    return json_({
      costs: readRows_(COSTS, COST_HEAD),
      nights: readRows_(NIGHTS, NIGHT_HEAD),
      readAt: new Date().toISOString()
    });
  } catch (err) {
    return json_({ costs: [], nights: [], error: String(err) });
  }
}

function doPost(e) {
  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'The request was not valid JSON.' });
  }
  if (!allowed_(payload.key)) return json_({ ok: false, locked: true });

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    writeRows_(COSTS, COST_HEAD, payload.costs || []);
    writeRows_(NIGHTS, NIGHT_HEAD, payload.nights || []);
    return json_({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}
