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
                        Steam ID
                    </button>{" "}
                </>
            );
        }
        const toolbar = (
            <>
                <button
                    onClick={async () => {
                        this.state.userInfo.optOut = true;
                        const userId = this.state.userInfo._id;
                        const r = await fetch(`https://couchdb-de.fishpondstudio.com/industryidle_ticks/${userId}`, {
                            headers: {
                                Authorization: `Basic ${btoa(getUrlParams()?.couchdb)}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(this.state.userInfo),
                            method: "put",
                        });
                        fetch(`${API_HOST}/opt-out?token=${getUrlParams()?.token}&userId=${userId}`);
                        alert(`${r.status} ${r.statusText}`);
                    }}
                >
                    Opt Out
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
                    IP Location
                </button>{" "}
                {steamButton}
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
