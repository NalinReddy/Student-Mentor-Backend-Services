const config = require('../config/config');
const Role = require('./role');
const moment = require('moment');

/**
 * Return a unique Order number
 */
function getUniqueOrderNumber() {
    const endingDigit = moment().year() % 10;
    return makeAlphanumericId(10, 'GT', `-${endingDigit}`);
}

function isAllowedAttachmentUpload(mimeType) {
  const allowedList = ['image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-powerpoint', // ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'image/heif',
  'image/heif-sequence'];
  return allowedList.some(mime => mime === mimeType);
}


/**
 * Return an id using the specified prefix and adding the specified length of
 * random characters.
 * @param length
 * @param prefix
 */
function makeAlphanumericId(length, prefix = '', suffix = '') {
    var result = `${prefix}`;
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    result += `${suffix}`;
    return result;
}

function transformCommaStringToArray(commaString) {
    let commaStringValues = commaString ?? [];

    if (typeof commaStringValues === 'string') {
        console.log(
            `Utils.transformCommaStringToArray commaStringValues is a string ${commaStringValues}. Transforming.`
        );
        // Using regular expression to split by comma (with or without space)
        commaStringValues = commaStringValues.split(/,\s*|,/);
    }

    return commaStringValues;
}

/**
 * Returns true if the specified role is and Admin or SuperAdmin.
 * @param {string} role 
 * @returns {boolean} returns true if specified role is an administrator
 */
function isAdministrator(role) {
    return role && (role === Role.Admin || role === Role.SuperAdmin);
}

function capitalizeWord(str) {
    if (!str?.length) return null;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getKeyFromValue(enumObj, value) {
  const keys = Object.keys(enumObj);
  for (const key of keys) {
      if (enumObj[key] === value) {
          return key;
      }
  }
  return null; // Return null if the value is not found
}

function getCurrentWeek(startDate) {
    const startOfSemester = moment(startDate);
    const currentDate = moment();
    
    // Calculate the difference in weeks
    const diffInWeeks = currentDate.diff(startOfSemester, 'weeks');
    
    // Add 1 because weeks are zero-indexed
    console.log(diffInWeeks + 1, "Current week..........");
    return diffInWeeks + 1;
}

module.exports = {
    makeAlphanumericId,
    transformCommaStringToArray,
    isAdministrator,
    capitalizeWord,
    getUniqueOrderNumber,
    isAllowedAttachmentUpload,
    getKeyFromValue,
    getCurrentWeek
};
