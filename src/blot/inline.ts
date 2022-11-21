import Attributor from "../attributor/attributor";
import AttributorStore from "../attributor/store";
import {
  Blot,
  BlotConstructor,
  Formattable,
  Parent,
  Root,
} from "./abstract/blot";
import ParentBlot from "./abstract/parent";
import LeafBlot from "./abstract/leaf";
import ShadowBlot from "./abstract/shadow";
import Registry from "../registry";
import Scope from "../scope";

// Shallow object comparison
function isEqual(obj1: Object, obj2: Object): boolean {
  if (Object.keys(obj1).length !== Object.keys(obj2).length) return false;
  // @ts-ignore
  for (let prop in obj1) {
    // @ts-ignore
    if (obj1[prop] !== obj2[prop]) return false;
  }
  return true;
}

class InlineBlot extends ParentBlot implements Formattable {
  static allowedChildren: BlotConstructor[] = [InlineBlot, LeafBlot];
  static blotName = "inline";
  static scope = Scope.INLINE_BLOT;
  static tagName = "SPAN";

  static formats(domNode: HTMLElement): any {
    const blot = Registry.find(domNode);
    if (blot == null) return undefined;
    const tagName = (<any>blot.scroll.query(InlineBlot.blotName)).tagName;
    if (domNode.tagName === tagName) {
      return undefined;
    } else if (typeof this.tagName === "string") {
      return true;
    } else if (Array.isArray(this.tagName)) {
      return domNode.tagName.toLowerCase();
    }
    return undefined;
  }

  constructor(scroll: Root, domNode: Node) {
    super(scroll, domNode);
    this.attributes = new AttributorStore(this.domNode);
  }

  format(name: string, value: any) {
    if (name === this.statics.blotName && !value) {
      this.children.forEach((child) => {
        if (!(child instanceof FormatBlot)) {
          child = child.wrap(InlineBlot.blotName, true);
        }
        this.attributes.copy(<FormatBlot>child);
      });
      this.unwrap();
    } else {
      const format = this.scroll.query(name);
      if (format instanceof Attributor) {
        this.attributes.attribute(format, value);
      } else if (
        value &&
        format != null &&
        (name !== this.statics.blotName || this.formats()[name] !== value)
      ) {
        this.replaceWith(name, value);
      }
    }
  }

  formatAt(index: number, length: number, name: string, value: any): void {
    if (
      this.formats()[name] != null ||
      this.scroll.query(name, Scope.ATTRIBUTE)
    ) {
      let blot = <InlineBlot>this.isolate(index, length);
      blot.format(name, value);
    } else {
      super.formatAt(index, length, name, value);
    }
  }

  optimize(context: { [key: string]: any }): void {
    super.optimize(context);
    let formats = this.formats();
    if (Object.keys(formats).length === 0) {
      return this.unwrap(); // unformatted span
    }
    let next = this.next;
    if (
      next instanceof InlineBlot &&
      next.prev === this &&
      isEqual(formats, next.formats())
    ) {
      next.moveChildren(this);
      next.remove();
    }
  }
}

export default InlineBlot;
