(function (dateTimeInput) {
  dateTimeInput.sections = {
    placeholder: placeholder,
    day: day,
    month: month,
    year: year,
    hour: hour,
    minute: minute
  };

  function placeholder(string) {
    var section = new dateTimeInput.Section(string);
    section.selectable = false;
    section.regexp = new RegExp(dateTimeInput.util.regexp.escapeRegExp(string));
    section.format = function (date) {
      return this.getPlaceholder();
    };
    section.correct = function (string) {
      return this.getPlaceholder();
    };
    section.validate = function (string, strict) {
      return strict ? this.getPlaceholder() === string : true;
    };
    section.modifyDate = function (date, modify) {
      return date;
    };
    section.isExtendable = function (string) {
      return false;
    };
    section.stringToDate = function (baseDate, string) {
      return baseDate;
    };
    return section;
  }

  function day() {
    var section = new dateTimeInput.Section('dd');
    section.format = function (date) {
      return moment(date).format('DD');
    };
    section.correct = function (string) {
      // We adding 01 to handle cases where 31 can be typed but month has only 28 days,
      // to fix this we setting month ot January which always has 31 days
      return moment(string + '/01', 'DD/MM', false).format('DD');
    };
    section.validate = function (string, strict) {
      return moment(string + '/01', 'DD/MM', strict).isValid();
    };
    section.modifyDate = function (date, modify) {
      return moment(date).add(modify, 'day').toDate();
    };
    section.isExtendable = function (string) {
      return +string <= 3;
    };
    section.stringToDate = function (baseDate, string) {
      if (isNaN(+string)) {
        return new Date(NaN);
      }

      return moment(baseDate).date(string).toDate();
    };
    return section;
  }

  function month() {
    var section = new dateTimeInput.Section('mm');
    section.format = function (date) {
      return moment(date).format('MM');
    };
    section.correct = function (string) {
      return moment(string, 'MM', false).format('MM');
    };
    section.validate = function (string, strict) {
      return moment(string, 'MM', strict).isValid();
    };
    section.modifyDate = function (date, modify) {
      return moment(date).add(modify, 'month').toDate();
    };
    section.isExtendable = function (string) {
      return +string <= 1;
    };
    section.stringToDate = function (baseDate, string) {
      var mDate = moment(string, 'MM', false);
      var date = moment(baseDate).month(mDate.month()).toDate();
      if (date.getDate() !== baseDate.getDate()) {
        return new Date(NaN);
      }

      return date;
    };
    return section;
  }

  function year() {
    var section = new dateTimeInput.Section('yyyy');
    section.format = function (date) {
      return moment(date).format('YYYY');
    };
    section.correct = function (string) {
      return moment(string, 'YYYY', false).format('YYYY');
    };
    section.validate = function (string, strict) {
      return moment(string, 'YYYY', strict).isValid();
    };
    section.modifyDate = function (date, modify) {
      return moment(date).add(modify, 'year').toDate();
    };
    section.isExtendable = function (string) {
      return +string <= 2000;
    };
    section.stringToDate = function (baseDate, string) {
      return moment(baseDate).year(string).toDate();
    };
    return section;
  }

  function hour() {
    var section = new dateTimeInput.Section('--');
    section.regexp = /[\w-]*/;
    section.format = hourFormat;
    section.correct = function (string) {
      return moment(string, 'HH', false).format('HH');
    };
    section.validate = function (string, strict) {
      return moment(string, 'HH', strict).isValid();
    };
    section.modifyDate = function (date, modify) {
      return moment(date).add(modify, 'hour').toDate();
    };
    section.isExtendable = function (string) {
      return +string <= 2;
    };
    section.stringToDate = function (baseDate, string) {
      if (isNaN(+string)) {
        return new Date(NaN);
      }

      return moment(baseDate).hour(string).toDate();
    };
    return section;
  }

  function minute() {
    var section = new dateTimeInput.Section('--');
    section.regexp = /[\w-]*/;
    section.format = minuteFormat;
    section.correct = function (string) {
      return moment(string, 'mm', false).format('mm');
    };
    section.validate = function (string, strict) {
      return moment(string, 'mm', strict).isValid();
    };
    section.modifyDate = function (date, modify) {
      return moment(date).add(modify, 'minute').toDate();
    };
    section.isExtendable = function (string) {
      return +string <= 6;
    };
    section.stringToDate = function (baseDate, string) {
      if (isNaN(+string)) {
        return new Date(NaN);
      }

      return moment(baseDate).minute(string).toDate();
    };
    return section;
  }

  function hourFormat(date) {
    return moment(date).format('HH');
  }

  function minuteFormat(date) {
    return moment(date).format('mm');
  }
})(dateTimeInput);
