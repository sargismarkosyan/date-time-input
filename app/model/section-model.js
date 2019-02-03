(function (dateTimeInput) {
  function Section(placeholder) {
    this.length = placeholder.length;
    this.placeholder = placeholder;
    this.selectable = true;
    this.regexp = /\w*/;
    this.queueMaxLength = this.length;
    this.inputQueue = [];

    this.format = _.noop;
    this.validate = _.noop;
    this.modifyDate = _.noop;
    this.isExtendable = _.noop;
    this.stringToDate = _.noop;
  }

  Section.status = {
    empty: 'empty',
    invalid: 'invalid',
    completed: 'completed',
    extendable: 'extendable'
  };

  Section.prototype.dateToString = function (date) {
    if (!date) {
      return this.getPlaceholder();
    }

    return this.format(date);
  };

  Section.prototype.getPlaceholder = function () {
    return this.placeholder;
  };

  Section.prototype.mapStringToDate = function (date, string) {
    if (!this.validate(string, true)) {
      date.setTime(NaN);
      return;
    }

    var mappedDate = this.stringToDate(date, string);
    date.setTime(mappedDate.getTime());
  };

  Section.prototype.modifyValue = function (value, modify) {
    var startDate = moment().startOf('year').toDate();
    var date = this.stringToDate(startDate, value);
    var modifiedDate;
    if (moment(date).isValid()) {
      modifiedDate = this.modifyDate(date, modify);
    } else {
      if (modify > 0) {
        modifiedDate = startDate;
      } else {
        modifiedDate = moment().endOf('year').toDate();
      }
    }

    return this.format(modifiedDate);
  };

  Section.prototype.updateInputQueue = function (data) {
    this.inputQueue.push(data);
    this.inputQueue.splice(0, this.inputQueue.length - this.queueMaxLength);
  };

  Section.prototype.clearQueue = function () {
    this.inputQueue.length = 0;
  };

  Section.prototype.processInput = function (e, newValue, oldValue, useData) {
    var self = this;
    if (this.validate(newValue, true)) {
      var isExtendable = this.isExtendable(newValue);
      return new Result(isExtendable ? Section.status.completed : Section.status.extendable, false, newValue);
    }

    if (dateTimeInput.util.event.isDeleteInputEvent(e)) {
      this.clearQueue();
      return new Result(Section.status.empty, false, this.getPlaceholder());
    }

    if (e.data && useData) {
      this.updateInputQueue(e.data);

      var hasResult = false;
      _.each(_.times(this.inputQueue.length), function (index) {
        var combinedValue = self.inputQueue.slice(index).join('');
        if (self.validate(combinedValue, false)) {
          var isExtendable = self.isExtendable(combinedValue) && combinedValue.length !== self.queueMaxLength;
          var correctedValue = self.correct(combinedValue);
          hasResult = new Result(isExtendable ? Section.status.extendable : Section.status.completed, true, correctedValue);
          return false;
        }
      });

      if (hasResult) {
        return hasResult;
      }
    }

    if (self.validate(newValue, false)) {
      var correctedValue = self.correct(newValue);
      return new Result(self.isExtendable(correctedValue) ? Section.status.extendable : Section.status.completed, false, correctedValue);
    }

    return new Result(Section.status.invalid, false, this.getPlaceholder());

    function Result(status, usedData, validValue) {
      this.status = status;
      this.usedData = usedData;
      this.validValue = validValue;
    }
  };

  dateTimeInput.Section = Section;
})(dateTimeInput);
