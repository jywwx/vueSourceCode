const conpileUtil = {
    getValue(expr, vm) {
        if (expr !== undefined) {
            return expr.split('.').reduce((data, currentVal) => {
                if (data[currentVal] !== undefined) {
                    return data[currentVal]
                } else if (vm[currentVal] !== undefined) {
                    return vm[currentVal]
                }

            }, vm.$data)
        }

    },
    setVal(expr, vm, newval) {
        expr.split('.').reduce((data, currentVal) => {
            data[currentVal] = newval
        }, vm.$data)
    },
    getContentText(expr, vm) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getValue(args[1], vm)
        })
    },
    text(node, expr, vm) { //expr:msg
        if (expr.indexOf('{{') !== -1) {
            let value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                if (expr === 'hello') {
                    console.log('做爱')
                }
                new Watcher(vm, args[1], (updateValue) => {
                    this.undater.testUpadter(node, this.getContentText(expr, vm))
                })
                return this.getValue(args[1], vm)
            })
            this.undater.testUpadter(node, value)
        } else {
            const value = this.getValue(expr, vm)
            this.undater.testUpadter(node, value)
        }

    },
    html(node, expr, vm) {
        const value = this.getValue(expr, vm)
        let watcher = new Watcher(vm, expr, (updateValue) => {
            this.undater.htmlUpadter(node, updateValue)
        })
        this.undater.htmlUpadter(node, value)
    },
    model(node, expr, vm) {
        const value = this.getValue(expr, vm)
        new Watcher(vm, expr, (updateValue) => {
            this.undater.modelUpadter(node, updateValue)
        })
        node.addEventListener('input', e => {
            this.setVal(expr, vm, e.target.value)
        })
        this.undater.modelUpadter(node, value)
    },
    on(node, expr, vm, enent) {
        const f = vm.$options.methods && vm.$options.methods[expr]
        node.addEventListener(enent, f.bind(vm), false)
    },
    bind(node, expr, vm, enent) {
        //设置属性
    },
    undater: {
        testUpadter(node, value) {
            node.textContent = value
        },
        htmlUpadter(node, value) {
            node.innerHTML = value
        },
        modelUpadter(node, value) {
            node.value = value
        }
    }
}


class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        this.vm = vm

        //1. 获取文档碎片 放入内存中  减少页面的回流与重绘
        const fragment = this.nodeToFragment(this.el)
            //2. 编译模板
        this.compile(fragment)
            //3. 追加子元素到根元素
        this.el.appendChild(fragment)
    }
    isElementNode(node) {
        return node.nodeType === 1
    }
    nodeToFragment(el) {
        //创建文档对象碎片
        const f = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild) {
            f.appendChild(firstChild)
        }
        return f
    }
    compile(fragment) {
        //通过文档节点碎片 获取子节点
        const childNodes = fragment.childNodes;
        [...childNodes].forEach(child => {
            if (this.isElementNode(child)) {
                //递归编译 子节点
                this.compileElement(child)
            } else {

                // 文本节点
                this.compileText(child)
            }
            if (child.childNodes && child.childNodes.length) {
                this.compile(child)
            }
        })
    }
    compileElement(node) {
        // <div v-text='msg'></div>
        const attributes = node.attributes;
        [...attributes].forEach(attr => {
            const { name, value } = attr
            if (this.isDirective(name)) {
                const [, directive] = name.split('-')
                const [dieName, enentName] = directive.split(":")
                conpileUtil[dieName](node, value, this.vm, enentName)
                    // 删除标签上的指令属性
                node.removeAttribute('v-' + directive)
            } else if (this.EventName(name)) {
                let [, eventName] = name.split('@')
                conpileUtil['on'](node, value, this.vm, eventName)
            }
        })
    }
    EventName(attrName) {
        return attrName.startsWith('@')
    }
    isDirective(attrname) {
        return attrname.startsWith('v-')
    }
    compileText(node) {
        const content = node.textContent
        if (/\{\{.+?\}\}/.test(content)) {
            conpileUtil['text'](node, content, this.vm)
        }
    }
}

function initComputed(vm, computed) {
    const watchers = vm._computedWatchers = Object.create(null)
    for (key in computed) {
        const useDef = computed[key]
        const getter = typeof computed[key] === 'function' ? useDef : useDef.get
        const noop = null
        watchers[key] = new Watcher(vm, getter, noop, { lazy: true })
        if (!(key in vm)) {
            defineComputed(vm, key, useDef)
        }
    }
}
const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: null,
    set: null
}

function defineComputed(vm, key, userDef) {
    Object.defineProperty(vm, key, {
        enumerable: true,
        configurable: true,
        get() {
            const watcher = vm._computedWatchers && vm._computedWatchers[key]
            if (watcher) {
                if (watcher.dirty) {
                    Dep.target = watcher
                    watcher.evaluate()
                    Dep.target = null
                }

                if (Dep.target) {
                    watcher.depend()
                }
                return watcher.value
            }
        }
    })
}

// function createComputedGetter(vm, key) {
//     return function computedGetter() {
//         const watcher = vm._computedWatchers && vm._computedWatchers[key]
//         console.log(watcher, "watcher")
//         if (watcher) {
//             if (watcher.dirty) {
//                 watcher.evaluate()
//             }
//             if (Dep.target) {
//                 watcher.depend()
//             }
//             return watcher.value
//         }
//     }
// }
class mVue {
    constructor(options) {
        this.$el = options.el;
        this.$data = options.data
        this.$options = options

        if (this.$el) {
            this.proxyData(this.$data)
            new Observer(this.$data)

            //1.实现数据的观察者 observe

            initComputed(this, options.computed)
                //2.实现指令的解析器compile
            new Compile(this.$el, this)


        }
    }
    proxyData(data) {
        for (const i in data) {
            Object.defineProperty(this, i, {
                get() {
                    return data[i]
                },
                set(newval) {
                    data[i] = newval
                }
            })
        }
    }
}