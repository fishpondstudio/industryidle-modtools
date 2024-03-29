import { API_HOST } from "./Constants";
import { getUrlParams } from "./Helper";
import { Page } from "./Page";

export class ConfigPage extends Page<{ config: string; saving: boolean }> {
   private codeMirror?: CodeMirror.Editor;

   constructor() {
      super();
      fetch(`${API_HOST}/config?token=${getUrlParams()?.token}`)
         .then((r) => {
            if (r.status === 200) {
               return r.text();
            } else {
               throw new Error(r.status + " " + r.statusText);
            }
         })
         .then((j) => {
            this.setState({ config: j });
         });
   }
   override componentDidUpdate() {
      if (this.codeMirror) {
         return;
      }
      const editor = document.getElementById("editor");
      if (editor) {
         this.codeMirror = CodeMirror(editor, {
            value: this.state.config,
            mode: "application/json",
            keyMap: "sublime",
            lineNumbers: true,
            indentUnit: 2,
            smartIndent: false,
            tabSize: 2,
            indentWithTabs: false,
         });
      }
   }
   render() {
      if (!this.state.config) {
         return null;
      }
      return (
         <div className="mobile">
            <div id="editor"></div>
            <br />
            <button
               disabled={this.state.saving}
               onClick={async () => {
                  if (!this.codeMirror) {
                     alert("Code Mirror is not initialized!");
                     return;
                  }
                  this.setState({ saving: true });
                  try {
                     await fetch(`${API_HOST}/config?token=${getUrlParams()?.token}`, {
                        method: "post",
                        body: this.codeMirror.getValue(),
                        headers: { "Content-Type": "text/plain" },
                     });
                     if (confirm("Config saved, open live config?")) {
                        openLiveConfig();
                     }
                  } catch (error) {
                     alert(error);
                  } finally {
                     this.setState({ saving: false });
                  }
               }}
            >
               Save
            </button>{" "}
            <button
               onClick={() => {
                  openLiveConfig();
               }}
            >
               Live Config
            </button>
         </div>
      );
   }
}

function openLiveConfig() {
   window.open(`${API_HOST}/config-live?token=${getUrlParams()?.token}`, "_blank");
}
