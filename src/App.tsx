import { Component } from "preact";
import { ChatPage } from "./ChatPage";
import { ConfigPage } from "./ConfigPage";
import { LeaderboardPage } from "./LeaderboardPage";
import { TradePage } from "./TradePage";

type Page =
    | typeof ChatPage
    | typeof ConfigPage
    | typeof TradePage
    | typeof LeaderboardPage;

export class App extends Component<{}, { page: Page }> {
    constructor() {
        super();
        this.state = { page: ChatPage };
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
                    <button
                        class={
                            this.state.page === LeaderboardPage ? "active" : ""
                        }
                        onClick={() => this.setState({ page: LeaderboardPage })}
                    >
                        Leaderboard
                    </button>
                </div>
                <this.state.page />
            </>
        );
    }
}
