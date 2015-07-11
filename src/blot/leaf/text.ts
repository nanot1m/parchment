import Blot from '../blot';
import InlineBlot from '../parent/inline';
import * as Registry from '../../registry';

class TextBlot extends Blot {
  static blotName = 'text';

  domNode: Text;
  private text: string;

  constructor(value: string | Node) {
    if (typeof value === 'string') {
      super(document.createTextNode(value));
    } else {
      super(value);
    }
    this.text = this.domNode.data;
  }

  deleteAt(index: number, length: number): void {
    this.text = this.text.slice(0, index) + this.text.slice(index + length);
    if (this.text.length > 0) {
      this.domNode.data = this.text;
    } else {
      this.remove();
    }
  }

  format(name: string, value: any): void {
    if (Registry.match(name, Registry.Type.ATTRIBUTE) !== null) {
      let target = <InlineBlot>this.wrap(InlineBlot.blotName, true);
      target.format(name, value);
    } else {
      super.format(name, value);
    }
  }

  formatAt(index: number, length: number, name: string, value: any): void {
    var target = <TextBlot>this.isolate(index, length);
    target.format(name, value);
  }

  getLength(): number {
    return this.text.length;
  }

  getValue(): string {
    return this.text;
  }

  insertAt(index: number, value: string, def?: any): void {
    if (def == null) {
      this.text = this.text.slice(0, index) + value + this.text.slice(index);
      this.domNode.data = this.text;
    } else {
      super.insertAt(index, value, def);
    }
  }

  split(index: number, force: boolean = false): Blot {
    if (!force) {
      if (index === 0) return this;
      if (index === this.getLength()) return this.next;
    }
    var after = Registry.create(this.statics.blotName, this.domNode.splitText(index));
    this.parent.insertBefore(after, this.next);
    this.text = this.domNode.data;
    return after;
  }
}


export default TextBlot;