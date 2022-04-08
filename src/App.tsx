import { Component } from "preact";
import { AntiCheatPage } from "./AntiCheatPage";
import { ChatPage } from "./ChatPage";
import { ConfigPage } from "./ConfigPage";
import { LeaderboardPage } from "./LeaderboardPage";
import { TradePage } from "./TradePage";
import { UserPage } from "./UserPage";

type Routes =
    | typeof ChatPage
    | typeof ConfigPage
    | typeof TradePage
    | typeof LeaderboardPage
    | typeof AntiCheatPage
    | typeof UserPage;

export const Routes: Record<string, Routes> = {
    "#chat": ChatPage,
    "#config": ConfigPage,
    "#trade": TradePage,
    "#leaderboard": LeaderboardPage,
    "#anticheat": AntiCheatPage,
    "#user": UserPage,
} as const;

export function getRoute() {
    const s = window.location.hash.split("?");
    const page = Routes[s[0]] ?? ChatPage;
    const params: Record<string, string> = {};
    new URLSearchParams(s[1]).forEach((value, key) => {
        params[key] = value;
    });
    return { page, params };
}

export class App extends Component<{}, { page: Routes; params: Record<string, string> }> {
    constructor() {
        super();
        window.onhashchange = () => {
            this.setState(getRoute());
        };
        this.state = getRoute();
    }

    render() {
        return (
            <>
                <div class="navigation">
                    <a class={this.state.page === ChatPage ? "active" : ""} href="#chat">
                        Chat
                    </a>

                    <a class={this.state.page === TradePage ? "active" : ""} href="#trade">
                        Trade
                    </a>
                    <a class={this.state.page === ConfigPage ? "active" : ""} href="#config">
                        CONFIG
                    </a>
                    <a class={this.state.page === LeaderboardPage ? "active" : ""} href="#leaderboard">
                        LB
                    </a>
                    <a class={this.state.page === AntiCheatPage ? "active" : ""} href="#anticheat">
                        AC
                    </a>
                </div>
                <this.state.page params={this.state.params} />
            </>
        );
    }
}
