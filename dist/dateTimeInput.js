;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jQuery', 'lodash'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('jQuery'), require('lodash'));
  } else {
    root.dateTimeInput = factory(root.jQuery, root._);
  }
}(this, function($, _) {
var dateTimeInput = {
  util: {}
};
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

(function (dateTimeInput) {
  var deleteInputTypes = [
    'deleteWordBackward',
    'deleteWordForward',
    'deleteSoftLineBackward',
    'deleteSoftLineForward',
    'deleteEntireSoftLine',
    'deleteHardLineBackward',
    'deleteHardLineForward',
    'deleteByDrag',
    'deleteByCut',
    'deleteContent',
    'deleteContentBackward',
    'deleteContentForward'
  ];

  dateTimeInput.util.event = {
    isDeleteInputEvent: isDeleteInputEvent
  };

  function isDeleteInputEvent(e) {
    var inputType = e.inputType;
    return deleteInputTypes.indexOf(inputType) > -1;
  }
})(dateTimeInput);

(function (dateTimeInput) {
  dateTimeInput.util.regexp = {
    escapeRegExp: escapeRegExp
  };

  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
   * Escaping user input that is to be treated as a literal string within a regular expression—that would otherwise be mistaken for a special character—can be accomplished by simple replacement:
   */
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
})(dateTimeInput);

(function (dateTimeInput) {
  function Calendar(element, options, defaultOptions) {
    this.element = element;
    this.options = _.clone(defaultOptions);
    this.show = _.noop;
    this.hide = _.noop;
    this.destroy = _.noop;
    this.shouldShow = _.noop;
    this.shouldHide = _.noop;
    this.isCompleted = _.noop;
    this.onOptionsChange = _.noop;

    this.setOptions(options);
    this.attachListeners();
  }

  Calendar.onDateSelectHoursAction = {
    unchanged: 'unchanged',
    start: 'start',
    end: 'end'
  };

  Calendar.prototype.setOptions = function (options) {
    _.extend(this.options, options);
    this.onOptionsChange(options);
  };

  Calendar.prototype.attachListeners = function () {
    var self = this;

    self.element.addEventListener('focus', function (e) {
      self.onFocusHandler(e);
    });

    self.element.addEventListener('focusout', function (e) {
      self.onFocusoutHandler(e);
    });

    self.element.addEventListener('input', function (e) {
      self.onInputHandler(e);
    });
  };

  Calendar.prototype.onFocusHandler = function (e) {
    if (this.shouldShow()) {
      this.show();
    }
  };

  Calendar.prototype.onFocusoutHandler = function (e) {
    if (this.shouldHide()) {
      this.hide();
    }
  };

  Calendar.prototype.onInputHandler = function (e) {
    if (this.isCompleted()) {
      this.hide();
    }
  };

  dateTimeInput.Calendar = Calendar;
})(dateTimeInput);

(function (dateTimeInput) {
  function Field(element, pattern, bindInput) {
    if (bindInput === undefined) {
      bindInput = true;
    }

    this.element = element;
    this.pattern = pattern;
    this.disableFocus = false;
    this.selectedSection = undefined;
    this.valueModifyListeners = [];

    this.formatField();
    this.attachListeners(bindInput);
    this.oldValue = this.element.value;
  }

  Field.prototype.attachListeners = function (bindInput) {
    var self = this;

    self.element.addEventListener('focus', function (e) {
      if (!self.disableFocus) {
        self.onFocusHandler(e);
      }
    });

    self.element.addEventListener('mousedown', function (e) {
      self.onMouseDownHandler(e);
    });

    self.element.addEventListener('mouseup', function (e) {
      self.onMouseUpHandler(e);
    });

    self.element.addEventListener('keydown', function (e) {
      self.onKeyDownHandler(e);
    });

    if (bindInput) {
      self.element.addEventListener('input', function (e) {
        self.inputEventListener(e);
      });
    }
  };

  Field.prototype.modifyElementValue = function (value) {
    this.element.value = value;
    _.each(this.valueModifyListeners, function (item) {
      item();
    });
  };

  Field.prototype.inputEventListener = function (e) {
    this.onInputHandler(e);
    this.oldValue = this.element.value;
  };

  Field.prototype.formatField = function () {
    var date = this.pattern.stringToDate(this.element.value);
    this.element.value = this.pattern.dateToString(date);
  };

  Field.prototype.onFocusHandler = function (e) {
    this.setSelectedSection(_.first(this.pattern.sections));
  };

  Field.prototype.onMouseDownHandler = function (e) {
    var self = this;

    if (!this.pattern.isEmpty(this.element.value)) {
      this.disableFocus = true;
    }

    setTimeout(function () {
      self.disableFocus = false;
    });
  };

  Field.prototype.onMouseUpHandler = function (e) {
    var focusedSection = this.pattern.getSectionByIndex(this.element.value, this.element.selectionStart, true);
    this.setSelectedSection(focusedSection);
  };

  Field.prototype.onKeyDownHandler = function (e) {
    var prevSection, nextSection;
    var tab = 'Tab';
    var arrowLeft = 'ArrowLeft';
    var arrowUp = 'ArrowUp';
    var arrowRight = 'ArrowRight';
    var arrowDown = 'ArrowDown';

    switch (e.key) {
      case arrowUp:
        if (!this.selectedSection) {
          return;
        }

        this.modifyElementValue(this.pattern.modifySectionValue(this.element.value, this.selectedSection, 1));
        this.selectSelectedSection();
        e.preventDefault();
        break;
      case arrowDown:
        if (!this.selectedSection) {
          return;
        }

        this.modifyElementValue(this.pattern.modifySectionValue(this.element.value, this.selectedSection, -1));
        this.selectSelectedSection();
        e.preventDefault();
        break;
      case arrowLeft:
        if (e.shiftKey) {
          break;
        }

        prevSection = this.pattern.getPrevSection(this.selectedSection, true);
        if (prevSection) {
          this.setSelectedSection(prevSection);
        }
        e.preventDefault();
        break;
      case arrowRight:
        if (e.shiftKey) {
          break;
        }

        nextSection = this.pattern.getNextSection(this.selectedSection, true);
        if (nextSection) {
          this.setSelectedSection(nextSection);
        }
        e.preventDefault();
        break;
      case tab:
        if (e.shiftKey) {
          prevSection = this.pattern.getPrevSection(this.selectedSection, true);
          if (prevSection) {
            this.setSelectedSection(prevSection);
            e.preventDefault();
          }

          break;
        }

        nextSection = this.pattern.getNextSection(this.selectedSection, true);
        if (nextSection) {
          this.setSelectedSection(nextSection);
          e.preventDefault();
        }
        break;
    }
  };

  Field.prototype.onInputHandler = function (e) {
    var self = this;
    var newValue = this.element.value;
    var date = dateTimeInput.util.date.stringToDate(newValue, true);
    var patternDate = this.pattern.stringToDate(newValue);
    if (date && !dateTimeInput.util.event.isDeleteInputEvent(e) && !e.data && !patternDate) {
      var patternStr = this.pattern.dateToString(date);
      if (patternStr !== newValue) {
        this.element.value = this.pattern.dateToString(date);
      }

      return;
    }

    var results = [];
    var useData = true;
    var sectionValues = this.pattern.getSectionValues(newValue);
    var affectedSections = this.pattern.getChangedSections(this.oldValue, newValue);
    _.each(affectedSections, function (item) {
      var result = item.section.processInput(e, item.newValue, item.oldValue, useData);
      result.section = item.section;
      if (result.usedData) {
        useData = false;
      }
      _.set(sectionValues, item.index, result.validValue);
      results.push(result);
    });

    this.element.value = sectionValues.join('');

    var emptySection = _.find(results, {
      status: dateTimeInput.Section.status.empty
    });
    var invalidSection = _.find(results, {
      status: dateTimeInput.Section.status.invalid
    });
    var completedSection = _.find(results, {
      status: dateTimeInput.Section.status.completed
    });
    var extendableSection = _.find(results, {
      status: dateTimeInput.Section.status.extendable
    });
    var nextActiveSection;
    if (emptySection || invalidSection || extendableSection) {
      nextActiveSection = _([emptySection, invalidSection, extendableSection])
        .compact()
        .map('section')
        .minBy(function (section) {
          return self.pattern.sections.indexOf(section);
        });
    } else if (completedSection) {
      nextActiveSection = self.pattern.getNextSection(completedSection.section, true);
    }

    if (nextActiveSection) {
      this.setSelectedSection(nextActiveSection);
    } else {
      this.selectSelectedSection();
    }
  };

  Field.prototype.setSelectedSection = function (section) {
    if (this.selectedSection && this.selectedSection !== section) {
      this.selectedSection.clearQueue();
    }

    this.selectedSection = section;
    if (!section) {
      return;
    }

    this.selectSelectedSection();
  };

  Field.prototype.selectSelectedSection = function () {
    var corners = this.pattern.getSectionCorners(this.element.value, this.selectedSection);
    if (corners.start !== this.element.selectionStart || corners.end !== this.element.selectionEnd) {
      this.element.setSelectionRange(corners.start, corners.end, 'forward');
    }
  };

  dateTimeInput.Field = Field;
})(dateTimeInput);

(function (dateTimeInput) {
  function Pattern(sections) {
    this.sections = sections;
  }

  Pattern.prototype.getGroupedRegexp = function () {
    var groupedRegExpStr = _(this.sections).map(function (item) {
      return '(' + item.regexp.source + ')';
    }).values().join('');

    return new RegExp(groupedRegExpStr);
  };

  Pattern.prototype.getSectionValues = function (value) {
    var regexp = this.getGroupedRegexp();
    var sectionValues = regexp.exec(value);
    if (!sectionValues) {
      return [];
    }

    sectionValues.splice(0, 1);//First one is the whole string
    return sectionValues;
  };

  Pattern.prototype.getNextSection = function (currentSection, selectableOnly) {
    var indexOfSection = this.sections.indexOf(currentSection);
    return _.find(this.sections.slice(indexOfSection + 1), function (section) {
      return !selectableOnly || section.selectable;
    });
  };

  Pattern.prototype.getPrevSection = function (currentSection, selectableOnly) {
    var indexOfSection = this.sections.indexOf(currentSection);
    return _.findLast(this.sections.slice(0, indexOfSection), function (section) {
      return !selectableOnly || section.selectable;
    });
  };

  Pattern.prototype.getSectionByIndex = function (value, pointerIndex, selectableOnly) {
    var currentIndex = 0;
    var sectionValues = this.getSectionValues(value);
    if (!sectionValues.length) {
      return _.first(this.sections);
    }

    return _.find(this.sections, function (section, index) {
      var selectableRule = !selectableOnly || section.selectable;
      currentIndex += _.get(sectionValues, index, '').length;
      return currentIndex >= pointerIndex && selectableRule;
    });
  };

  Pattern.prototype.getSectionCorners = function (value, section) {
    var sectionValues = this.getSectionValues(value);
    if (!sectionValues.length) {
      return {
        start: 0,
        end: 0
      };
    }

    var indexOfSection = this.sections.indexOf(section);
    var start = _(sectionValues.slice(0, indexOfSection)).sumBy('length');
    var end = start + _.get(sectionValues, indexOfSection, '').length;

    return {
      start: start,
      end: end
    };
  };

  Pattern.prototype.getChangedSections = function (oldValue, newValue) {
    var self = this;
    var sectionOldValues = this.getSectionValues(oldValue);
    var sectionNewValues = this.getSectionValues(newValue);

    if (!sectionOldValues.length || !sectionNewValues.length) {
      return _.map(this.sections, function (section, index) {
        return new Change(index, section, '', '');
      });
    }

    var changedSections = [];

    _.each(sectionNewValues, function (newValue, index) {
      var oldValue = _.get(sectionOldValues, index);
      if (newValue !== oldValue) {
        changedSections.push(new Change(index, _.get(self.sections, index), oldValue, newValue));
      }
    });

    return changedSections;

    function Change(index, section, oldValue, newValue) {
      this.index = index;
      this.section = section;
      this.oldValue = oldValue;
      this.newValue = newValue;
    }
  };

  Pattern.prototype.isEmpty = function (value) {
    return this.dateToString() === value;
  };

  Pattern.prototype.dateToString = function (date) {
    return _.map(this.sections, function (section) {
      return section.dateToString(date);
    }).join('');
  };

  Pattern.prototype.stringToDate = function (value) {
    var date = moment().startOf('year').toDate();
    var sectionValues = this.getSectionValues(value);
    if (!sectionValues.length) {
      return;
    }

    _.each(this.sections, function (section, index) {
      section.mapStringToDate(date, _.get(sectionValues, index));
    });

    if (moment(date).isValid()) {
      return date;
    }
  };

  Pattern.prototype.setSectionValue = function (string, section, value) {
    var sectionValues = this.getSectionValues(value);
    if (!sectionValues.length) {
      return;
    }

    var indexOfSection = this.sections.indexOf(section);
    _.set(sectionValues, indexOfSection, value);
    return sectionValues.join('');
  };

  Pattern.prototype.modifySectionValue = function (value, selectedSection, modify) {
    var sectionValues = this.getSectionValues(value);
    if (!sectionValues.length) {
      return value;
    }

    var sectionIndex = this.sections.indexOf(selectedSection);
    _.set(sectionValues, sectionIndex, selectedSection.modifyValue(_.get(sectionValues, sectionIndex), modify));

    return sectionValues.join('');
  };

  dateTimeInput.Pattern = Pattern;
})(dateTimeInput);

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

(function (dateTimeInput) {
  var bootstrapDatepickerDefaultOptions = {
    hoursSelectBehaviour: undefined,
    minViewMode: null,
    startDate: null,
    language: 'en',
    endDate: null,
    onShow: _.noop,
    onHide: _.noop,
    onStayInField: _.noop
  };

  var hourSection = dateTimeInput.sections.hour();
  var minuteSection = dateTimeInput.sections.minute();

  dateTimeInput.calendars = {
    bootstrapDatepicker: bootstrapDatepicker
  };

  function bootstrapDatepicker(element, fieldModel, options) {
    if (!$.fn.datepicker) {
      throw 'To install datepicker install it first. https://github.com/uxsolutions/bootstrap-datepicker';
    }

    var $element = $(element);
    var shouldShowOnFocus = true;
    var indexOfPatternHoursSection = _.findIndex(fieldModel.pattern.sections, {format: hourSection.format});
    var indexOfPatternMinutesSection = _.findIndex(fieldModel.pattern.sections, {format: minuteSection.format});

    var calendar = new dateTimeInput.Calendar($element.get(0), options, bootstrapDatepickerDefaultOptions);

    calendar.show = function () {
      setupDatepicker(calendar.options);
      $element.datepicker('show');
    };

    calendar.hide = function () {
      $element.datepicker('hide');
      destroyDatepicker(calendar.options);
    };

    calendar.destroy = function () {
      destroyDatepicker(calendar.options);
    };

    calendar.shouldShow = function () {
      var oldValue = shouldShowOnFocus;
      shouldShowOnFocus = true;
      return oldValue;
    };

    calendar.shouldHide = function () {
      var $datepicker = $('.datepicker');
      if (!$datepicker.length) {
        return true;
      }

      return !$datepicker.is(':hover');
    };

    calendar.isCompleted = function () {
      return !!fieldModel.pattern.stringToDate(calendar.element.value);
    };

    calendar.onOptionsChange = function (changedOptions) {
      var datepicker = $element.data('datepicker');
      if (!datepicker) {
        return;
      }

      if ('startDate' in changedOptions) {
        datepicker.setStartDate(_.get(changedOptions, 'startDate', null));
      }

      if ('endDate' in changedOptions) {
        datepicker.setEndDate(_.get(changedOptions, 'endDate', null));
      }
    };

    return calendar;

    function setupDatepicker(options) {
      $element.datepicker({
          format: {
            toDisplay: function (date, otherFormat, language) {
              date = moment(date).add(-moment(date).utcOffset(), 'minutes').toDate();
              var dateFromValue = stringToDate($element.val());
              if (date && dateFromValue) {
                date.setHours(dateFromValue.getHours());
                date.setMinutes(dateFromValue.getMinutes());
                date.setSeconds(dateFromValue.getSeconds());
                date.setMilliseconds(dateFromValue.getMilliseconds());
              }

              var fieldValue = applyHoursSelectBehaviour(date, fieldModel.oldValue, calendar.options);
              fieldModel.oldValue = fieldValue;
              calendar.hide();
              return fieldValue;
            },
            toValue: function (value, otherFormat, language) {
              var date = stringToDate(value);
              if (date) {
                date = dateToUTC(date);
              }
              return date;
            }
          },
          keyboardNavigation: false,
          language: options.language,
          forceParse: false,
          maxViewMode: 2,
          minViewMode: options.minViewMode || null,
          startDate: options.startDate || null,
          endDate: options.endDate || null
        })
        .on('show', options.onShow)
        .on('hide', options.onHide);
    }

    function destroyDatepicker(options) {
      $element.datepicker('destroy').off('show', options.onShow).off('hide', options.onHide);
    }

    function applyHoursSelectBehaviour(date, oldValue, options) {
      var mValidDate = moment(date);
      switch (options.hoursSelectBehaviour) {
        case dateTimeInput.Calendar.onDateSelectHoursAction.unchanged:
          if (indexOfPatternHoursSection === -1 || indexOfPatternMinutesSection === -1) {
            return fieldModel.pattern.dateToString(mValidDate.toDate());
          }

          var newValue = fieldModel.pattern.dateToString(mValidDate.toDate());
          var newSectionValues = fieldModel.pattern.getSectionValues(newValue);
          var oldSectionValues = fieldModel.pattern.getSectionValues(oldValue);
          _.set(newSectionValues, indexOfPatternHoursSection, _.get(oldSectionValues, indexOfPatternHoursSection));
          _.set(newSectionValues, indexOfPatternMinutesSection, _.get(oldSectionValues, indexOfPatternMinutesSection));
          var emptySection = _.find(fieldModel.pattern.sections, function (section, index) {
            return section.selectable && section.getPlaceholder() === _.get(newSectionValues, index);
          });

          if (emptySection) {
            options.onStayInField();
            setTimeout(function () {
              shouldShowOnFocus = false;
              calendar.element.focus();
              fieldModel.setSelectedSection(emptySection);
            });
          }

          return newSectionValues.join('');

        case dateTimeInput.Calendar.onDateSelectHoursAction.end:
          mValidDate = mValidDate.endOf('day');
          return fieldModel.pattern.dateToString(mValidDate.toDate());

        default: //start case
          mValidDate = mValidDate.startOf('day');
          return fieldModel.pattern.dateToString(mValidDate.toDate());
      }
    }

    function stringToDate(value) {
      var date = fieldModel.pattern.stringToDate(value);
      if (!date) {
        date = dateTimeInput.util.date.stringToDate(value, false);
      }

      return date;
    }

    function dateToUTC(date) {
      return moment(date).add(moment(date).utcOffset(), 'minutes').toDate();
    }
  }
})(dateTimeInput);

(function (dateTimeInput) {
  dateTimeInput.patterns = {
    date: date,
    dateTime: dateTime
  };

  function date() {
    return new dateTimeInput.Pattern([
      dateTimeInput.sections.day(),
      dateTimeInput.sections.placeholder('/'),
      dateTimeInput.sections.month(),
      dateTimeInput.sections.placeholder('/'),
      dateTimeInput.sections.year()
    ]);
  }

  function dateTime() {
    return new dateTimeInput.Pattern([
      dateTimeInput.sections.day(),
      dateTimeInput.sections.placeholder('/'),
      dateTimeInput.sections.month(),
      dateTimeInput.sections.placeholder('/'),
      dateTimeInput.sections.year(),
      dateTimeInput.sections.placeholder(' '),
      dateTimeInput.sections.hour(),
      dateTimeInput.sections.placeholder(':'),
      dateTimeInput.sections.minute()
    ]);
  }
})(dateTimeInput);

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

return dateTimeInput;
}));
