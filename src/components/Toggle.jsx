import React, {Component} from 'react';
import {injectStyles, removeStyle} from '../utils/inject-style';
import {extend, omit, has, last, first} from '../utils/helpers';
import style from '../style/toggle';
import config from '../config/toggle';
import isComponentOfType from '../utils/is-component-of-type.js';
import {requestAnimationFrame, cancelAnimationFrame} from '../utils/animation-frame-management';
import unionClassNames from '../utils/union-class-names';

function sanitizeChildProps(properties) {
  return omit(properties, [
    'className',
    'defaultValue',
    'firstChoiceProps',
    'focusStyle',
    'handleProps',
    'onFocus',
    'onBlur',
    'onUpdate',
    'onMouseDown',
    'onMouseLeave',
    'onMouseUp',
    'onTouchStart',
    'secondChoiceProps',
    'sliderProps',
    'sliderWrapperProps',
    'style',
    'tabIndex',
    'value'
  ]);
}

function sanitizeSliderProps(properties) {
  return omit(properties, [
    'style',
    'onClick',
    'onTouchStart',
    'onTouchMove',
    'onTouchEnd',
    'onTouchCancel'
  ]);
}

function sanitizeSliderWrapperProps(properties) {
  return omit(properties, [
    'ref',
    'style'
  ]);
}

function sanitizeChoiceProps(properties) {
  return omit(properties, [
    'ref',
    'style'
  ]);
}

function sanitizeHandleProps(properties) {
  return omit(properties, [
    'onMouseDown',
    'onMouseMove',
    'onMouseUp',
    'onMouseLeave',
    'onTouchStart',
    'onTouchMove',
    'onTouchEnd',
    'onTouchCancel',
    'ref',
    'style'
  ]);
}

/**
 * Verifies that the provided property is a Choice from Belle.
 */
function choicePropType(props, propName, componentName) {
  if (!(props[propName] && isComponentOfType('Belle Choice', props[propName]))) {
    return new Error(`Invalid children supplied to \`${componentName}\`, expected a Choice component from Belle.`);
  }
}

/**
 * Verifies that the children is an array containing only two choices with a
 * different value.
 */
function validateChoices(props, propName, componentName) {
  const error = React.PropTypes.arrayOf(choicePropType)(props, propName, componentName);
  if (error) return error;

  if (props.children && props.children.length !== 2) {
    return new Error(`Invalid children supplied to \`${componentName}\`, expected exactly two Choice components.`);
  }
  if (props.children &&
      first(props.children).props.value === last(props.children).props.value) {
    return new Error(`Invalid children supplied to \`${componentName}\`, expected different value properties for the provided Choice components.`);
  }
}

/**
 * Update focus style for the speficied styleId.
 *
 * @param styleId {string} - a unique id that exists as class attribute in the DOM
 * @param properties {object} - the components properties optionally containing custom styles
 */
function updatePseudoClassStyle(styleId, properties, preventFocusStyleForTouchAndClick) {
  let focusStyle;
  if (preventFocusStyleForTouchAndClick) {
    focusStyle = { outline: 0 };
  } else {
    focusStyle = extend({}, style.focusStyle, properties.focusStyle);
  }

  const styles = [
    {
      id: styleId,
      style: focusStyle,
      pseudoClass: 'focus'
    }
  ];

  injectStyles(styles);
}

/**
 * Toggle component
 */
export default class Toggle extends Component {

  constructor(properties) {
    super(properties);

    let value;
    if (has(properties, 'valueLink')) {
      value = properties.valueLink.value;
    } else if (has(properties, 'value')) {
      value = properties.value;
    } else if (has(properties, 'defaultValue')) {
      value = properties.defaultValue;
    } else {
      value = false;
    }

    this.state = {
      firstChoiceProps: sanitizeChoiceProps(properties.firstChoiceProps),
      childProps: sanitizeChildProps(properties),
      secondChoiceProps: sanitizeChoiceProps(properties.secondChoiceProps),
      handleProps: sanitizeHandleProps(properties.handleProps),
      isActive: false,
      isDraggingWithMouse: false,
      isDraggingWithTouch: false,
      sliderProps: sanitizeSliderProps(properties.sliderProps),
      sliderWrapperProps: sanitizeSliderWrapperProps(properties.sliderWrapperProps),
      value: value,
      wasFocusedWithClickOrTouch: false
    };

    this._touchStartedAtSlider = false;
    this._touchEndedNotInSlider = false;

    this._preventTouchSwitch = false;

    this._mouseDragStart = undefined;
    this._mouseDragEnd = undefined;
    this._preventMouseSwitch = false;

    // The isFocused attribute is used to apply the one-time focus animation.
    // As it is reset after every render it can't be set inside state as this
    // would trigger an endless loop.
    this.isFocused = false;

    this.preventFocusStyleForTouchAndClick = has(properties, 'preventFocusStyleForTouchAndClick') ? properties.preventFocusStyleForTouchAndClick : config.preventFocusStyleForTouchAndClick;
  }

  static displayName = 'Belle Toggle';

  static propTypes = {
    activeHandleStyle: React.PropTypes.object,
    children: validateChoices,
    className: React.PropTypes.string,
    defaultValue: React.PropTypes.bool,
    disabled: React.PropTypes.bool,
    disabledHandleStyle: React.PropTypes.object,
    disabledStyle: React.PropTypes.object,
    firstChoiceProps: React.PropTypes.object,
    firstChoiceStyle: React.PropTypes.shape({
      width: React.PropTypes.number
    }),
    focusStyle: React.PropTypes.object,
    handleProps: React.PropTypes.shape({
      onMouseDown: React.PropTypes.func,
      onMouseMove: React.PropTypes.func,
      onMouseUp: React.PropTypes.func,
      onMouseLeave: React.PropTypes.func,
      onTouchStart: React.PropTypes.func,
      onTouchMove: React.PropTypes.func,
      onTouchEnd: React.PropTypes.func,
      onTouchCancel: React.PropTypes.func
    }),
    handleStyle: React.PropTypes.shape({
      height: React.PropTypes.number,
      width: React.PropTypes.number
    }),
    hoverHandleStyle: React.PropTypes.object,
    onBlur: React.PropTypes.func,
    onUpdate: React.PropTypes.func,
    onFocus: React.PropTypes.func,
    onKeyDown: React.PropTypes.func,
    onMouseDown: React.PropTypes.func,
    onMouseEnter: React.PropTypes.func,
    onMouseLeave: React.PropTypes.func,
    onMouseUp: React.PropTypes.func,
    onTouchStart: React.PropTypes.func,
    secondChoiceProps: React.PropTypes.object,
    secondChoiceStyle: React.PropTypes.shape({
      width: React.PropTypes.number
    }),
    sliderProps: React.PropTypes.shape({
      onClick: React.PropTypes.func,
      onTouchStart: React.PropTypes.func,
      onTouchMove: React.PropTypes.func,
      onTouchEnd: React.PropTypes.func,
      onTouchCancel: React.PropTypes.func
    }),
    sliderStyle: React.PropTypes.object,
    sliderWrapperProps: React.PropTypes.object,
    sliderWrapperStyle: React.PropTypes.object,
    style: React.PropTypes.shape({
      width: React.PropTypes.number
    }),
    value: React.PropTypes.bool,
    valueLink: React.PropTypes.shape({
      value: React.PropTypes.bool.isRequired,
      requestChange: React.PropTypes.func.isRequired
    }),
    wrapperProps: React.PropTypes.object
  };

  static defaultProps = {
    disabled: false
  };

  /**
   * Generates the style-id & inject the focus style.
   *
   * The style-id is based on React's unique DOM node id.
   */
  componentWillMount() {
    const id = this._reactInternalInstance._rootNodeID.replace(/\./g, '-');
    this.styleId = `style-id${id}`;
    updatePseudoClassStyle(this.styleId, this.props, this.preventFocusStyleForTouchAndClick);
  }

  componentWillReceiveProps(properties) {
    const newState = {
      firstChoiceProps: sanitizeChoiceProps(properties.firstChoiceProps),
      childProps: sanitizeChildProps(properties),
      secondChoiceProps: sanitizeChoiceProps(properties.secondChoiceProps),
      handleProps: sanitizeHandleProps(properties.handleProps),
      sliderProps: sanitizeSliderProps(properties.sliderProps),
      sliderWrapperProps: sanitizeSliderWrapperProps(properties.sliderWrapperProps)
    };

    if (has(properties, 'valueLink')) {
      newState.value = properties.valueLink.value;
    } else if (has(properties, 'value')) {
      newState.value = properties.value;
    }
    this.setState(newState);

    this.preventFocusStyleForTouchAndClick = has(properties, 'preventFocusStyleForTouchAndClick') ? properties.preventFocusStyleForTouchAndClick : config.preventFocusStyleForTouchAndClick;

    removeStyle(this.styleId);
    updatePseudoClassStyle(this.styleId, properties, this.preventFocusStyleForTouchAndClick);
  }

  /**
   * Deactivate the focused attribute in order to make sure the focus animation
   * only runs once when the component is focused on & not after re-rendering
   * e.g when the user clicks on the toggle.
   */
  componentDidUpdate() {
    this.isFocused = false;
  }

  /**
   * Remove a component's associated styles whenever it gets removed from the DOM.
   */
  componentWillUnmount() {
    removeStyle(this.styleId);
  }

  /**
   * Activate the focused attribute used to determine when to show the
   * one-time focus animation and trigger a render.
   */
  _onFocus(event) {
    if (!this.props.disabled) {
      this.isFocused = true;
      this.forceUpdate();
    }

    if (this.props.onFocus) {
      this.props.onFocus(event);
    }
  }

  /**
   * Deactivate the focused attribute used to determine when to show the
   * one-time focus animation and trigger a render.
   */
  _onBlur(event) {
    this.isFocused = false;
    this.setState({ wasFocusedWithClickOrTouch: false });

    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  }

  _onMouseDownOnWrapper(event) {
    if (!this.props.disabled) {
      this.setState({ wasFocusedWithClickOrTouch: true, isActive: true });
    }
    if (this.props.onMouseDown) {
      this.props.onMouseDown(event);
    }
  }

  _onMouseUpOnWrapper(event) {
    if (!this.props.disabled) {
      this.setState({ isActive: false });
    }
    if (this.props.onMouseUp) {
      this.props.onMouseUp(event);
    }
  }

  _onTouchStartOnWrapper(event) {
    if (!this.props.disabled) {
      this.setState({ wasFocusedWithClickOrTouch: true });
    }
    if (this.props.onTouchStart) {
      this.props.onTouchStart(event);
    }
  }

  _onClickAtSlider(event) {
    if (!this.props.disabled) {
      this._triggerChange(!this.state.value);
    }
    if (this.props.sliderProps && this.props.sliderProps.onClick) {
      this.props.sliderProps.onClick(event);
    }
  }

  _onMouseDownOnHandle(event) {
    // check for left mouse button pressed
    if (event.button === 0 && !this.props.disabled) {
      const defaultSliderOffset = this._getSliderOffset();
      this._mouseDragStart = event.pageX - (this.state.value ? defaultSliderOffset : 0);
      this._preventMouseSwitch = false;

      this.setState({
        isDraggingWithMouse: true,
        sliderOffset: (this.state.value ? defaultSliderOffset : 0)
      });
    }

    if (this.props.handleProps && this.props.handleProps.onMouseDown) {
      this.props.handleProps.onMouseDown(event);
    }
  }

  _onMouseMoveOnHandle(event) {
    if (this.state.isDraggingWithMouse && !this.props.disabled) {
      // the requestAnimationFrame function must be executed in the context of window
      // see http://stackoverflow.com/a/9678166/837709
      const animationFrame = requestAnimationFrame.call(
        window,
        this._triggerUpdateComponentOnMouseMove.bind(this, event.pageX)
      );

      if (this.previousMouseMoveFrame) {
        // the cancelAnimationFrame function must be executed in the context of window
        // see http://stackoverflow.com/a/9678166/837709
        cancelAnimationFrame.call(window, this.previousMouseMoveFrame);
      }
      this.previousMouseMoveFrame = animationFrame;
    }

    if (this.props.handleProps && this.props.handleProps.onMouseMove) {
      this.props.handleProps.onMouseMove(event);
    }
  }

  _onMouseUpOnHandle(event) {
    if (!this.props.disabled) {
      if (this._mouseDragEnd) {
        if (!this._preventMouseSwitch) {
          this._triggerChange(!this.state.value);
        } else if (this._preventMouseSwitch) {
          const value = this._mouseDragEnd > (this._getHandleWidth() / 2);
          this._triggerChange(value);
        }
      } else {
        this._triggerChange(!this.state.value);
      }
    }

    this._mouseDragStart = undefined;
    this._mouseDragEnd = undefined;
    this._preventMouseSwitch = false;

    if (this.props.handleProps && this.props.handleProps.onMouseUp) {
      this.props.handleProps.onMouseUp(event);
    }
  }

  _onMouseLeaveOnHandle(event) {
    if (!this.props.disabled) {
      if (this._mouseDragStart && !this._preventMouseSwitch) {
        this._triggerChange(!this.state.value);
      } else if (this._mouseDragStart && this._preventMouseSwitch) {
        const value = this._mouseDragEnd > (this._getHandleWidth() / 2);
        this._triggerChange(value);
      } else {
        this.setState({ isActive: false });
      }
    }

    this._mouseDragStart = undefined;
    this._mouseDragEnd = undefined;
    this._preventMouseSwitch = false;

    if (this.props.handleProps && this.props.handleProps.onMouseLeave) {
      this.props.handleProps.onMouseLeave(event);
    }
  }

  _onTouchStartAtSlider(event) {
    if (event.touches.length === 1 && !this.props.disabled) {
      this._touchStartedAtSlider = true;
      this.setState({
        isActive: true
      });
    }

    if (this.props.sliderProps && this.props.sliderProps.onTouchStart) {
      this.props.sliderProps.onTouchStart(event);
    }
  }

  _onTouchMoveAtSlider(event) {
    if (event.touches.length === 1 && this._touchStartedAtSlider && !this.props.disabled) {
      // the requestAnimationFrame function must be executed in the context of window
      // see http://stackoverflow.com/a/9678166/837709
      const animationFrame = requestAnimationFrame.call(
        window,
        this._triggerUpdateComponentOnTouchMoveAtSlider.bind(this, event.touches[0])
      );

      if (this.previousTouchMoveAtSliderFrame) {
        // the cancelAnimationFrame function must be executed in the context of window
        // see http://stackoverflow.com/a/9678166/837709
        cancelAnimationFrame.call(window, this.previousTouchMoveAtSliderFrame);
      }
      this.previousTouchMoveAtSliderFrame = animationFrame;
    }

    if (this.props.sliderProps && this.props.sliderProps.onTouchMove) {
      this.props.sliderProps.onTouchMove(event);
    }
  }

  _onTouchEndAtSlider(event) {
    // prevent the onClick to happen
    event.preventDefault();

    if (this._touchStartedAtSlider && !this._touchEndedNotInSlider && !this.props.disabled) {
      this.setState({
        isActive: false
      });
      this._triggerChange(!this.state.value);
    } else {
      this.setState({ isActive: false });
    }
    this._touchStartedAtSlider = false;
    this._touchEndedNotInSlider = false;

    if (this.props.sliderProps && this.props.sliderProps.onTouchEnd) {
      this.props.sliderProps.onTouchEnd(event);
    }
  }

  _onTouchCancelAtSlider(event) {
    this.setState({ isActive: false });
    this._touchStartedAtSlider = false;
    this._touchEndedNotInSlider = false;

    if (this.props.sliderProps && this.props.sliderProps.onTouchCancel) {
      this.props.sliderProps.onTouchCancel(event);
    }
  }

  _onTouchStartHandle(event) {
    event.preventDefault();

    // check for one touch as multiple could be browser gestures and only one
    // is relevant for us
    if (event.touches.length === 1 && !this.props.disabled) {
      this._preventTouchSwitch = false;

      const defaultSliderOffset = this._getSliderOffset();
      this.setState({
        isDraggingWithTouch: true,
        sliderOffset: (this.state.value ? defaultSliderOffset : 0)
      });

      this._touchDragStart = event.touches[0].pageX - (this.state.value ? defaultSliderOffset : 0);
    }

    if (this.props.handleProps && this.props.handleProps.onTouchStart) {
      this.props.handleProps.onTouchStart(event);
    }
  }

  _onTouchMoveHandle(event) {
    if (event.touches.length === 1 && this.state.isDraggingWithTouch && !this.props.disabled) {
      // the requestAnimationFrame function must be executed in the context of window
      // see http://stackoverflow.com/a/9678166/837709
      const animationFrame = requestAnimationFrame.call(
        window,
        this._triggerUpdateComponentOnTouchMoveAtHandle.bind(this, event.touches[0])
      );

      if (this.previousTouchMoveAtHandleFrame) {
        // the cancelAnimationFrame function must be executed in the context of window
        // see http://stackoverflow.com/a/9678166/837709
        cancelAnimationFrame.call(window, this.previousTouchMoveAtHandleFrame);
      }
      this.previousTouchMoveAtHandleFrame = animationFrame;
    }

    if (this.props.handleProps && this.props.handleProps.onTouchMove) {
      this.props.handleProps.onTouchMove(event);
    }
  }

  _onTouchEndHandle(event) {
    // prevent the onClick to happen
    event.preventDefault();

    if (this.state.isDraggingWithTouch && !this.props.disabled) {
      // no click & move was involved
      if (this._touchDragEnd) {
        if (this._preventTouchSwitch) {
          const value = this._touchDragEnd > (this._getHandleWidth() / 2);
          this._triggerChange(value);
        } else {
          this._triggerChange(!this.state.value);
        }
      } else { // click like
        this._triggerChange(!this.state.value);
      }
    } else {
      this.setState({
        isActive: false,
        isDraggingWithTouch: false
      });
    }

    this._touchDragStart = undefined;
    this._touchDragEnd = undefined;
    this._preventTouchSwitch = false;

    if (this.props.handleProps && this.props.handleProps.onTouchEnd) {
      this.props.handleProps.onTouchEnd(event);
    }
  }

  _onTouchCancelHandle(event) {
    this.setState({
      isDraggingWithTouch: false
    });
    this._touchDragStart = undefined;
    this._touchDragEnd = undefined;
    this._preventTouchSwitch = false;

    if (this.props.handleProps && this.props.handleProps.onTouchCancel) {
      this.props.handleProps.onTouchCancel(event);
    }
  }

  _onKeyDown(event) {
    if (!this.props.disabled) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this._onArrowLeftKeyDown();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this._onArrowRightKeyDown();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this._onEnterOrSpaceKeyDown();
      }
    }
    if (this.props.onKeyDown) {
      this.props.onKeyDown(event);
    }
  }

  /**
   * Flip value in case it is false.
   */
  _onArrowLeftKeyDown() {
    if (this.state.value === true) {
      this._triggerChange(false);
    }
  }

  /**
   * Flip value in case it is true.
   */
  _onArrowRightKeyDown() {
    if (this.state.value === false) {
      this._triggerChange(true);
    }
  }

   /**
    * Flip value and trigger change.
    */
  _onEnterOrSpaceKeyDown() {
    this._triggerChange(!this.state.value);
  }

  _onMouseEnterAtSliderWrapper() {
    this.setState({
      isHovered: true
    });
    if (this.props.onMouseEnter) {
      this.props.onMouseEnter(event);
    }
  }

  _onMouseLeaveAtSliderWrapper() {
    this.setState({
      isHovered: false,
      isActive: false
    });
    if (this.props.onMouseLeave) {
      this.props.onMouseLeave(event);
    }
  }

  _getHandleHeight() {
    return has(this.props.handleStyle, 'height') ? this.props.handleStyle.height : style.handleStyle.height;
  }

  _getHandleWidth() {
    return has(this.props.handleStyle, 'width') ? this.props.handleStyle.width : style.handleStyle.width;
  }

  _getSliderOffset() {
    const firstChoiceWidth = has(this.props.firstChoiceStyle, 'width') ? this.props.firstChoiceStyle.width : style.firstChoiceStyle.width;

    return firstChoiceWidth - this._getHandleWidth() / 2;
  }

  _getToggleWidth() {
    return has(this.props.style, 'width') ? this.props.style.width : style.style.width;
  }

  _triggerChange(value) {
    if (has(this.props, 'valueLink')) {
      this.props.valueLink.requestChange(value);
      this.setState({
        isDraggingWithMouse: false,
        isDraggingWithTouch: false,
        isActive: false
      });
    } else if (has(this.props, 'value')) {
      this.setState({
        isDraggingWithMouse: false,
        isDraggingWithTouch: false,
        isActive: false
      });
    } else {
      this.setState({
        value: value,
        isDraggingWithMouse: false,
        isDraggingWithTouch: false,
        isActive: false
      });
    }

    if (this.props.onUpdate) {
      this.props.onUpdate({ value: value });
    }
  }

  _triggerUpdateComponentOnMouseMove(pageX) {
    const difference = pageX - this._mouseDragStart;

    if (this.state.value &&
        this._mouseDragEnd &&
        difference > this._mouseDragEnd) {
      this._preventMouseSwitch = true;
    } else if (!this.state.value &&
               this._mouseDragEnd &&
               difference < this._mouseDragEnd) {
      this._preventMouseSwitch = true;
    }

    this._mouseDragEnd = difference;

    if (difference < 0 || difference > this._getToggleWidth() - this._getHandleWidth()) return;

    this.setState({
      sliderOffset: difference
    });
  }

  _triggerUpdateComponentOnTouchMoveAtSlider(touch) {
    const touchedElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const firstChoiceNode = React.findDOMNode(this.refs.firstChoice);
    const secondChoiceNode = React.findDOMNode(this.refs.secondChoice);

    this._touchEndedNotInSlider = touchedElement !== firstChoiceNode &&
                                  touchedElement !== secondChoiceNode;
    if (this.state.isActive && this._touchEndedNotInSlider) {
      this.setState({ isActive: false });
    } else if (!this.state.isActive && !this._touchEndedNotInSlider) {
      this.setState({ isActive: true });
    }
  }

  _triggerUpdateComponentOnTouchMoveAtHandle(touch) {
    const sliderWrapperNode = React.findDOMNode(this.refs.sliderWrapper);
    const rect = sliderWrapperNode.getBoundingClientRect();
    const difference = touch.pageX - this._touchDragStart;
    const horizontalTolerance = this._getHandleWidth() * 2;
    const verticalTolerance = this._getHandleHeight() * 2;

    // touch left the allowed handle drag area
    if (touch.clientX < rect.left - horizontalTolerance ||
        touch.clientX > rect.right + horizontalTolerance ||
        touch.clientY < rect.top - verticalTolerance ||
        touch.clientY > rect.bottom + verticalTolerance) {
      if (this._preventTouchSwitch) {
        const value = difference > (this._getHandleWidth() / 2);
        this._triggerChange(value);
      } else {
        this._triggerChange(!this.state.value);
      }
    } else if (this.state.isDraggingWithTouch) { // is still dragging
      if (this.state.value &&
          this._touchDragEnd &&
          difference > this._touchDragEnd) {
        this._preventTouchSwitch = true;
      } else if (!this.state.value &&
                 this._touchDragEnd &&
                 difference < this._touchDragEnd) {
        this._preventTouchSwitch = true;
      }

      if (difference < 0 || difference > this._getToggleWidth() - this._getHandleWidth()) return;

      this._touchDragEnd = difference;
      this.setState({
        sliderOffset: difference
      });
    }
  }

  render() {
    let wrapperStyle = extend({}, style.style, this.props.style);

    if (this.isFocused && !this.state.wasFocusedWithClickOrTouch) {
      wrapperStyle = extend({}, wrapperStyle, style.focusStyle, this.props.focusStyle);
    }

    let computedSliderStyle;
    let handleStyle;

    const sliderWrapperStyle = extend({}, style.sliderWrapperStyle, this.props.sliderWrapperStyle);
    const defaultSliderOffset = this._getSliderOffset();

    if (this.state.isDraggingWithMouse || this.state.isDraggingWithTouch) {
      computedSliderStyle = extend({}, style.sliderStyle, this.props.sliderStyle, {
        left: this.state.sliderOffset - defaultSliderOffset,
        transition: 'none'
      });
      // right now even when handle is clicked, it momentarily shows this grabbing styles
      // may be this.state.isDraggingWithMouse should be set to true only after mouse movement starts
      const activeStyle = extend({}, style.activeHandleStyle, this.props.handleStyle);
      handleStyle = extend({}, style.handleStyle, activeStyle, this.props.activeHandleStyle, {
        left: this.state.sliderOffset,
        transition: activeStyle.transition ? activeStyle.transition : 'none'
      });
    } else {
      handleStyle = extend({}, style.handleStyle, this.props.handleStyle);
      computedSliderStyle = extend({}, style.sliderStyle, {
        left: this.state.value ? 0 : -defaultSliderOffset
      });

      if (this.state.isActive) {
        handleStyle = extend({}, handleStyle, style.activeHandleStyle, this.props.activeHandleStyle);
      } else if (this.state.isHovered) {
        handleStyle = extend({}, handleStyle, style.hoverHandleStyle, this.props.hoverHandleStyle);
      }

      const position = {
        left: this.state.value ? defaultSliderOffset : 0
      };
      handleStyle = extend({}, handleStyle, position);
    }

    const computedTrueChoice = first(this.props.children) ? first(this.props.children) : '✓';
    const computedFalseChoice = last(this.props.children) ? last(this.props.children) : '✘';

    const computedTrueChoiceStyle = extend({}, style.firstChoiceStyle, this.props.firstChoiceStyle);
    const computedFalseChoiceStyle = extend({}, style.secondChoiceStyle, this.props.secondChoiceStyle);

    const hasCustomTabIndex = this.props.wrapperProps && this.props.wrapperProps.tabIndex;
    let tabIndex = hasCustomTabIndex ? this.props.wrapperProps.tabIndex : '0';
    if (this.props.disabled) {
      tabIndex = -1;
      wrapperStyle = extend({}, wrapperStyle, style.disabledStyle, this.props.disabledStyle);
      handleStyle = extend({}, handleStyle, style.disabledHandleStyle, this.props.disabledHandleStyle);
    }

    const role = has(this.state.childProps, 'role') ? this.state.childProps.role : 'checkbox';

    return (
      <div style={ wrapperStyle }
           tabIndex={ tabIndex }
           className={ unionClassNames(this.props.className, this.styleId) }
           onKeyDown={ this._onKeyDown.bind(this) }
           onMouseDown={ this._onMouseDownOnWrapper.bind(this) }
           onMouseUp={ this._onMouseUpOnWrapper.bind(this) }
           onTouchStart={ this._onTouchStartOnWrapper.bind(this) }
           onFocus={ this._onFocus.bind(this) }
           onBlur={ this._onBlur.bind(this) }
           onMouseEnter = { this._onMouseEnterAtSliderWrapper.bind(this) }
           onMouseLeave = { this._onMouseLeaveAtSliderWrapper.bind(this) }
           role={ role }
           aria-checked={ this.state.value }
           {...this.state.childProps} >
        <div style={ sliderWrapperStyle }
             ref="sliderWrapper"
             {...this.state.sliderWrapperProps}>
          <div style={ computedSliderStyle }
               onClick={ this._onClickAtSlider.bind(this) }
               onTouchStart={ this._onTouchStartAtSlider.bind(this) }
               onTouchMove={ this._onTouchMoveAtSlider.bind(this) }
               onTouchEnd={ this._onTouchEndAtSlider.bind(this) }
               onTouchCancel={ this._onTouchCancelAtSlider.bind(this) }
               {...this.state.sliderProps}>
            <div ref="firstChoice"
                 style={ computedTrueChoiceStyle }
                 {...this.state.firstChoiceProps}>
              { computedTrueChoice }
            </div>
            <div ref="secondChoice"
                 style={ computedFalseChoiceStyle }
                 {...this.state.secondChoiceProps}>
              { computedFalseChoice }
            </div>
          </div>
        </div>
        <div ref="handle"
             style={ handleStyle }
             onMouseDown={ this._onMouseDownOnHandle.bind(this) }
             onMouseMove={ this._onMouseMoveOnHandle.bind(this) }
             onMouseUp={ this._onMouseUpOnHandle.bind(this) }
             onMouseLeave={ this._onMouseLeaveOnHandle.bind(this) }
             onTouchStart={ this._onTouchStartHandle.bind(this) }
             onTouchMove={ this._onTouchMoveHandle.bind(this) }
             onTouchEnd={ this._onTouchEndHandle.bind(this) }
             onTouchCancel={ this._onTouchCancelHandle.bind(this) }
             {...this.state.handleProps} />
      </div>
    );
  }
}
