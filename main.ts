import { Plugin } from 'obsidian';
import katex from 'katex';
import { StateField } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet, WidgetType } from '@codemirror/view';

export default class StandardLaTeXPlugin extends Plugin {

	async onload() {
		this.registerEditorExtension(latexHighlightExtension);
	}

	onunload() {

	}

}

const LATEX_REGEX = /\\\((.*?)\\\)|\\\[(.*?)\\\]/gs;

class LatexWidget extends WidgetType {
  match: RegExpExecArray;

  constructor(match: RegExpExecArray) {
    super();
    this.match = match;
  }

  toDOM(view: EditorView): HTMLElement {
    const span = document.createElement('span');
    const expr = this.match[1] ?? this.match[2] ?? '';
    const displayMode = this.match[2] !== undefined;

    // 可选：加个类名便于调试
    span.className = displayMode ? 'cm-latex-block' : 'cm-latex-inline';

    try {
      katex.render(expr, span, {
        displayMode,
        throwOnError: false,
        output: 'html'
      });
    } catch (e) {
      span.textContent = `$${expr}$`;
      span.className = 'cm-latex-error';
    }

    return span;
  }
}

const latexHighlightField = StateField.define<DecorationSet>({
  create(state: { doc: { toString: () => string; }; }) {
	return highlightLatex(state.doc.toString());
  },
  update(decorations: any, tr: { docChanged: any; state: { doc: { toString: () => string; }; }; }) {
	return tr.docChanged ? highlightLatex(tr.state.doc.toString()) : decorations;
  }
});

function highlightLatex(text: string): DecorationSet {
  const decorations: any[] = [];
  let match;
  while ((match = LATEX_REGEX.exec(text)) !== null) {

    const from = match.index;
    const to = from + match[0].length;
    decorations.push(
      Decoration.mark({
        attributes: { class: 'cm-latex-formula' , spellcheck: 'false'},
      }).range(from, to)
    );

    decorations.push(
      Decoration.widget({
        widget: new LatexWidget(match)
      }).range(to)
    );
  }
  return Decoration.set(decorations, true);
}

export const latexHighlightExtension = [
  latexHighlightField,
  EditorView.decorations.from(latexHighlightField, (d: any) => d)
];
