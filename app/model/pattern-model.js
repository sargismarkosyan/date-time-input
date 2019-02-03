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
