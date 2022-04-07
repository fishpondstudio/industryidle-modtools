import { Component } from "preact";
import { API_HOST } from "./Constants";
import { getUrlParams } from "./Helper";

interface UserInfoDialogProps {
    userId: string | null;
}

export class UserInfoDialog extends Component<UserInfoDialogProps, { userInfo: any }> {
    override async componentDidUpdate(prevProps: UserInfoDialogProps) {
        if (this.props.userId === prevProps.userId || this.props.userId === null) {
            return;
        }
        const r = await fetch(`https://couchdb-de.fishpondstudio.com/industryidle_ticks/${this.props.userId}`, {
            headers: {
                Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                "Content-Type": "application/json",
            },
            method: "get",
        });
        const j = await r.json();
        this.setState({ userInfo: j });
    }
    override render() {
        if (!this.state.userInfo) {
            return null;
        }
        let steamButton = null;
        if (this.state.userInfo?.platformId?.startsWith?.("steam:")) {
            const steamId = this.state.userInfo.platformId.split(":")[1];
            steamButton = (
                <>
                    <button
                        onClick={() => {
                            window.open(
                                `https://api.fishpondstudio.com/steam/steamid-trusted?steamid=${steamId}`,
                                "_blank"
                            );
                        }}
                    >
                        Steam:{steamId}
                    </button>{" "}
                </>
            );
        }
        const toolbar = (
            <>
                <button
                    onClick={() => {
                        optInOrOut(this.state.userInfo, true).then((r) => {
                            alert(r.map((v) => `${v.status} ${v.statusText}`).join(", "));
                        });
                    }}
                    disabled={this.state.userInfo.optOut}
                >
                    Opt Out
                </button>{" "}
                <button
                    onClick={() => {
                        optInOrOut(this.state.userInfo, false).then((r) => {
                            alert(r.map((v) => `${v.status} ${v.statusText}`).join(", "));
                        });
                    }}
                    disabled={!this.state.userInfo.optOut}
                >
                    Opt In
                </button>{" "}
                <button
                    onClick={() => {
                        window.open(
                            `https://api.fishpondstudio.com/trade-token?userId=${this.state.userInfo._id}&token=${
                                getUrlParams()?.token
                            }`,
                            "_blank"
                        );
                    }}
                >
                    Trade Token
                </button>{" "}
                <button
                    onClick={() => {
                        window.open(`https://iplocation.io/ip/${this.state.userInfo.lastIp}`, "_blank");
                    }}
                >
                    {this.state.userInfo.lastIp}
                </button>{" "}
                {steamButton}
                <button
                    onClick={() => {
                        window.open(
                            `https://couchdb-de.fishpondstudio.com/_utils/#database/industryidle_ticks/${this.props.userId}`,
                            "_blank"
                        );
                    }}
                >
                    CouchDB
                </button>{" "}
                <button
                    onClick={() => {
                        this.props.userId = null;
                        this.setState({ userInfo: null });
                    }}
                >
                    Close
                </button>
            </>
        );
        return (
            <dialog open>
                {toolbar}
                <pre>{JSON.stringify(this.state.userInfo, null, 4)}</pre>
                {toolbar}
            </dialog>
        );
    }
}

export function optInOrOut(userInfo: any, optOut: boolean) {
    userInfo.optOut = optOut;
    const userId = userInfo._id;
    return Promise.all([
        fetch(`https://couchdb-de.fishpondstudio.com/industryidle_ticks/${userId}`, {
            headers: {
                Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userInfo),
            method: "put",
        }),
        fetch(`${API_HOST}/opt-${optOut ? "out" : "in"}?token=${getUrlParams()?.token}&userId=${userId}`),
    ]);
}
