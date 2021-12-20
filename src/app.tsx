import { Component } from "preact";
import { ChatPage } from "./ChatPage";
import { ConfigPage } from "./ConfigPage";
import { TradePage } from "./TradePage";

type Page = typeof ChatPage | typeof ConfigPage | typeof TradePage;

export class App extends Component<{}, { page: Page }> {
    constructor() {
        super();
        this.setState({ page: ChatPage });
    }

    render() {
        return (
            <>
                <div class="navigation">
                    <button
                        class={this.state.page === ChatPage ? "active" : ""}
                        onClick={() => this.setState({ page: ChatPage })}
                    >
                        Chat
                    </button>
                    <button
                        class={this.state.page === TradePage ? "active" : ""}
                        onClick={() => this.setState({ page: TradePage })}
                    >
                        Trade
                    </button>
                    <button
                        class={this.state.page === ConfigPage ? "active" : ""}
                        onClick={() => this.setState({ page: ConfigPage })}
                    >
                        Config
                    </button>
                </div>
                <this.state.page />
            </>
        );
    }
}
