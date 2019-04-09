export type ValueChangedCallback<T> = (args: T, sender: any) => void;
export class ValueStore<T> {
    private items = new Array<{ func: ValueChangedCallback<T>, sender: any }>();
    private _value: T;

    constructor(value: T) {
        this._value = value;
    }
    add(func: ValueChangedCallback<T>, sender?: any): ValueChangedCallback<T> {
        this.items.push({ func, sender });
        return func;
    }
    remove(func: ValueChangedCallback<T>) {
        this.items = this.items.filter(o => o.func != func);
    }
    fire(value: T) {
        this.items.forEach(o => o.func(value, o.sender));
    }
    get value(): T {
        // if (this._value === undefined)
        //     return null

        return this._value;
    }
    set value(value: T) {
        this._value = value;
        this.fire(value);
    }
}