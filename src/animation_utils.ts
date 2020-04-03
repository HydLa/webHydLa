/** keyに対してはvalueが複数対応し，valueに対してはkeyが一意に対応するデータを扱う */
export class MaltiBiMap<K, V>{
  private map: Map<K, Set<V>>;
  private reverse: Map<V, K>;

  constructor() {
    this.map = new Map<K, Set<V>>();
    this.reverse = new Map<V, K>();
  }

  set(key: K, value: V) {
    if (!this.map.has(key)) {
      this.map.set(key, new Set<V>());
    }
    this.map.get(key)?.add(value);
    if (!this.reverse.has(value)) {
      this.reverse.set(value, key);
    }
  };

  clear() {
    this.map = new Map<K, Set<V>>();
    this.reverse = new Map<V, K>();
  }

  getValue(key: K) {
    return <Set<V>>this.map.get(key);
  };
  getKey(value: V) {
    return <K>this.reverse.get(value);
  };

  deleteKey(key: K) {
    if (this.map.has(key)) {
      let values = <Set<V>>this.map.get(key);
      values.forEach((v) => this.reverse.delete(v));
      this.map.delete(key);
    }
  }
  deleteValue(value: V) {
    if (this.reverse.has(value)) {
      let key = <K>this.reverse.get(value);
      this.map.delete(key);
      this.reverse.delete(value);
    }
  };

  hasKey(key: K) {
    return this.map.has(key);
  };
  hasValue(value: V) {
    return this.reverse.has(value)
  };

  keys(): IterableIterator<K> {
    return this.map.keys();
  };
  values(): IterableIterator<V> {
    return this.reverse.keys();
  };

  // entries(): IterableIterator<[K, V]>;
  // forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void;
}