"use strict";

jest.dontMock('../lib/components/Option');

import {extend} from 'underscore';
import React from 'react/addons';
const TestUtils = React.addons.TestUtils;

// Babel would move an import in front of the jest.dontMock. That's why require
// is used here.
const Select = require('../lib/components/Select');
const Option = require('../lib/components/Option');

describe('Select', () => {

  it('should initialise _isHovered & _isDisplayedAsSelected during construction', () => {
    const option = TestUtils.renderIntoDocument(
      <Option value='rome'>Rome</Option>
    );

    expect(option.props._isHovered).toBeFalsy();
    expect(option.props._isDisplayedAsSelected).toBeFalsy();
  });

  it('should show the select style in case _isDisplayedAsSelected is true', () => {
    const option = TestUtils.renderIntoDocument(
      <Option value='rome' _isDisplayedAsSelected={ true }>Rome</Option>
    );

    const div = TestUtils.findRenderedDOMComponentWithTag(option, 'div');
    expect(div.props.style.padding).toBe(0);
  });

  it('should show the hover style in case _isHovered is true', () => {
    const option = TestUtils.renderIntoDocument(
      <Option value='rome' _isHovered={ true }>Rome</Option>
    );

    const div = TestUtils.findRenderedDOMComponentWithTag(option, 'div');
    expect(div.props.style.background).toBe('#F5F5F5');
  });

});