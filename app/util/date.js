(function (dateTimeInput) {
  dateTimeInput.util.date = {
    stringToDate: stringToDate
  };

  function stringToDate(value, strict) {
    var date;
    var momentParseFormats = [
      'DD/MM/YYYY HH:mm:SS',
      'DD/MM/YYYY HH:mm',
      'DD/MM/YYYY',
      'YYYY-MM-DD HH:mm:SS',
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DD',
      'LLLL',
      'LLL',
      'LL',
      'L'
    ];
    _.each(momentParseFormats, function (format) {
      var mDate = moment(value, format, strict);
      if (mDate.isValid()) {
        date = mDate.toDate();
        return false;
      }
    });

    return date;
  }
})(dateTimeInput);
