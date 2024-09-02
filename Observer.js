class Watcher {
  constructor(vm, expr, cb, islazy) {
    if (islazy === undefined) {
      this.vm = vm;
      this.expr = expr;
      this.cb = cb;
      this.oldVal = this.getOldVal();
    } else {
      this.lazy = islazy.lazy;
      this.vm = vm;
      this.get = expr;
      this.value = "asd";
      this.dirty = islazy.lazy;
    }
  }
  getOldVal() {
    Dep.target = this;
    const oldVal = conpileUtil.getValue(this.expr, this.vm);
    Dep.target = null;
    return oldVal;
  }
  Update() {
    if (this.lazy) {
      this.dirty = true;
    } else {
      const newVal = conpileUtil.getValue(this.expr, this.vm);
      if (newVal !== this.oldVal) {
        this.cb(newVal);
      }
    }
  }
  gets() {
    return this.get.call(this.vm, this.vm);
  }
  evaluate() {
    this.value = this.gets();
    this.dirty = false;
  }
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }
}

class Dep {
  constructor() {
    this.subs = [];
  }
  // 收集观察者 收集依赖
  addSub(watcher) {
    this.subs.push(watcher);
  }
  //  通知观察者 更新
  notify() {
    this.subs.forEach((w) => w.Update());
  }
}

class Observer {
  constructor(data) {
    this.observe(data);
  }
  observe(data) {
    /**
     * person ={
     *
     * name:'小马哥'，
     * age:'29',
     * fav:{
     *  a:sex,
     *  b:姑娘
     * }
     * }
     */
    if (data && typeof data === "object") {
      Object.keys(data).forEach((key) => {
        this.defineReactive(data, key, data[key]);
      });
    }
  }
  defineReactive(object, key, value) {
    //递归遍历属性 添加监听 数据劫持
    this.observe(value);
    const dep = new Dep();
    Object.defineProperty(object, key, {
      enumerable: true,
      configurable: true,
      get() {
        // 订阅数据变化的时候 往dep中添加观察者
        console.log(dep, key, "key");
        Dep.target && dep.addSub(Dep.target);
        return value;
      },
      set: (newVal) => {
        this.observe(newVal);
        if (newVal !== value) {
          value = newVal;
        }
        dep.notify();
      },
    });
  }
}
