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
import ShadowBlot from "./abstract/shadow";
import LeafBlot from "./abstract/leaf";
import InlineBlot from "./inline";
import Registry from "../registry";
import Scope from "../scope";

class BlockBlot extends ParentBlot implements Formattable {
  static allowedChildren: BlotConstructor[] = [InlineBlot, BlockBlot, LeafBlot];
  static blotName = "block";
  static scope = Scope.BLOCK_BLOT;
  static tagName = "P";

  static formats(domNode: HTMLElement): any {
    const blot = Registry.find(domNode);
    if (blot == null) return undefined;
    const tagName = (<any>blot.scroll.query(BlockBlot.blotName)).tagName;
    if (domNode.tagName === tagName) {
      return undefined;
    } else if (typeof this.tagName === "string") {
      return true;
    } else if (Array.isArray(this.tagName)) {
      return domNode.tagName.toLowerCase();
    }
  }

  constructor(scroll: Root, domNode: Node) {
    super(scroll, domNode);
    this.attributes = new AttributorStore(this.domNode);
  }

  format(name: string, value: any) {
    const format = this.scroll.query(name, Scope.BLOCK);
    if (format == null) {
      return;
    } else if (name === this.statics.blotName && !value) {
      this.replaceWith(BlockBlot.blotName);
    } else {
      super.format(name, value);
    }
  }

  formatAt(index: number, length: number, name: string, value: any): void {
    if (this.scroll.query(name, Scope.BLOCK) != null) {
      this.format(name, value);
    } else {
      super.formatAt(index, length, name, value);
    }
  }

  insertAt(index: number, value: string, def?: any): void {
    if (def == null || this.scroll.query(value, Scope.INLINE) != null) {
      // Insert text or inline
      super.insertAt(index, value, def);
    } else {
      const after = this.split(index);
      if (after != null) {
        const blot = this.scroll.create(value, def);
        after.parent.insertBefore(blot, after);
      } else {
        throw new Error("Attempt to insertAt after block boundaries");
      }
    }
  }

  update(mutations: MutationRecord[], context: { [key: string]: any }): void {
    if (navigator.userAgent.match(/Trident/)) {
      this.build();
    } else {
      super.update(mutations, context);
    }
  }
}

export default BlockBlot;
