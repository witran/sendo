import debounce from "debounce";

// on change is called when chart's setter is called
// usually used to mark chart as dirty for re-render
class Prop {
  constructor(
    name,
    { default: defaultVal = null, triggerUpdate = true, onChange = () => {} }
  ) {
    this.name = name;
    this.defaultVal = defaultVal;
    this.triggerUpdate = triggerUpdate;
    this.onChange = onChange;
  }
}


function createClass({
  stateInit = () => ({}),
  props: rawProps = {},
  methods = {},
  aliases = {},
  init: initFn = () => {},
  update: updateFn = () => {}
}) {
  const props = Object.keys(rawProps).map(
    propName => new Prop(propName, rawProps[propName])
  );

  // create a object with following signature
  //   object.state[propName] return value of object's propName
  //   object[propName](<newVal>) get, or set value of object's propName to value
  //   object[methodName] = function(state, args){...}
  //   stateInit is called when createInstance is called, populate private state
  function createInstance(options = {}) {
    // state object containing props
    let state = Object.assign(
      {},
      stateInit instanceof Function ? stateInit(options) : stateInit, // Support plain objects for backwards compatibility
      { initialised: false }
    );

    // constructor
    function instance(dom) {
      init(dom, options);
      update();

      return instance;
    }

    const init = function(dom, options) {
      initFn.call(instance, dom, state, options);
      state.initialised = true;
    };

    const update = debounce(() => {
      if (!state.initialised) return;
      updateFn.call(instance, state);
    });

    instance.resetProps = function() {
      // default prop values
      props.forEach(prop => {
        instance[prop.name](prop.defaultVal);
      });
    };

    // methods - getter / setter
    props.forEach(prop => {
      instance[prop.name] = getSetProp(
        prop.name,
        prop.triggerUpdate,
        prop.onChange
      );

      function getSetProp(prop, triggerUpdate = false, onChange = () => {}) {
        return function(newVal) {
          const curVal = state[prop];
          if (!arguments.length) {
            return curVal;
          }
          state[prop] = newVal;
          onChange.call(instance, newVal, state, curVal);
          if (triggerUpdate) {
            update();
          }
          return instance;
        };
      }
    });

    // methods - user-defined
    Object.keys(methods).forEach(methodName => {
      instance[methodName] = (...args) =>
        methods[methodName].call(comp, state, ...args);
    });

    // aliases
    Object.entries(aliases).forEach(
      ([alias, target]) => (comp[alias] = comp[target])
    );

    // init
    instance.resetProps();

    // constructor
    return instance;
  }

  return createInstance;
}

export default createClass;
