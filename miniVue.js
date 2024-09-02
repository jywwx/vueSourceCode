// 简化版的 Dep 类
class Dep {
  constructor() {
    this.subs = []; // 存储与该 Dep 相关联的所有 Watcher
  }

  addSub(watcher) {
    this.subs.push(watcher); // 添加一个 Watcher 到 subs 列表
  }

  depend() {
    if (Dep.target) {
      Dep.target.addDep(this); // 将当前 Dep 添加到正在被依赖收集的 Watcher 中
    }
  }

  notify() {
    this.subs.forEach((sub) => sub.update()); // 通知所有依赖该 Dep 的 Watcher 进行更新
  }
}

// 全局变量，用于追踪当前的 Watcher
Dep.target = null;
const targetStack = [];

// 简化版的 Watcher 类
class Watcher {
  constructor(vm, getter, callback) {
    this.vm = vm;
    this.getter = getter.bind(vm); // 将 getter 函数绑定到 Watcher 实例
    this.callback = callback;
    this.value = this.get(); // 初始化时调用 getter，进行依赖收集
  }

  get() {
    Dep.target = this; // 设置当前 Watcher 为全局 target，用于依赖收集
    const value = this.getter(); // 执行 getter 进行依赖收集
    Dep.target = null; // 依赖收集完毕，清空 target
    return value;
  }

  update() {
    const newValue = this.get();
    if (newValue !== this.value) {
      this.value = newValue;
      this.callback(newValue); // 值变化时调用回调
    }
  }

  addDep(dep) {
    dep.addSub(this); // 将当前 Watcher 添加到 Dep 的订阅列表中
  }
}

// 简化版的 defineComputed 函数
function defineComputed(target, key, getter) {
  const dep = new Dep();
  Object.defineProperty(target, key, {
    get() {
      dep.depend(); // 依赖收集
      return getter(); // 调用 getter 获取计算属性的值
    },
    set(newVal) {
        if (newVal !== val) {
          val = newVal;
          dep.notify(); // 通知所有依赖该数据的 Watcher 进行更新
        }
      }
  });
}

// 简化版的 initComputed 函数
function initComputed(vm, computed) {
  vm._computedWatchers = Object.create(null);
  for (const key in computed) {
    const userDef = computed[key];
    const getter =
      typeof userDef === "function" ? userDef.bind(vm) : userDef.get.bind(vm);
    // 创建一个 Watcher，负责依赖收集和计算属性的更新
    vm._computedWatchers[key] = new Watcher(vm, getter, (newValue) => {
      vm[key] = newValue;
    });
    // 定义计算属性
    defineComputed(vm, key, getter);
  }
}

// 为响应式数据创建 Dep
function defineReactive(obj, key) {
  const dep = new Dep();
  let val = obj[key];

  Object.defineProperty(obj, key, {
    get() {
      dep.depend(); // 依赖收集
      return val;
    },
    set(newVal) {
      val = newVal;
      dep.notify(); // 通知所有依赖该数据的 Watcher 进行更新
    },
  });
}

// 测试用例
class Vue {
  constructor(options) {
    this.data = options.data;
    for (const key in this.data) {
      defineReactive(this.data, key); // 为每个数据属性设置响应式
    }
    initComputed(this, options.computed);
  }
}

// 模拟 Vue 的使用
const vm = new Vue({
  data: {
    message: "Hello",
  },
  computed: {
    reversedMessage() {
      return this.data.message.split("").reverse().join("");
    },
  },
});

// 测试输出
// 更新数据并触发 computed 更新
vm.data.message = "World";

console.log(vm.reversedMessage); // 输出: "dlroW"
