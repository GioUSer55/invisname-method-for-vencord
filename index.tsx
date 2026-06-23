/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { copyToClipboard } from "@utils/clipboard";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Button, Forms, Menu, React, Toasts, UserStore } from "@webpack/common";

// The three combining enclosing marks that render invisibly in Discord names
// ⃤ = COMBINING ENCLOSING UPWARD POINTING TRIANGLE (U+20E4)
// ⃟ = COMBINING ENCLOSING DIAMOND (U+20DF)  
// ⃝ = COMBINING ENCLOSING CIRCLE (U+20DD)
const INVIS_SEQUENCE = "\u20E4\u20DF\u20DD";

const GuildMemberStore = findByPropsLazy("getMember", "getMembers");
const UserProfileModal = findByPropsLazy("openUserProfileModal");
const FluxDispatcher = findByPropsLazy("dispatch", "_currentDispatchActionType");

const settings = definePluginSettings({
    sequence: {
        type: OptionType.STRING,
        description: "The invisible character sequence used for names",
        default: INVIS_SEQUENCE,
        restartNeeded: false,
    },
    autoCopy: {
        type: OptionType.BOOLEAN,
        description: "Automatically copy the sequence to clipboard when using quick copy",
        default: true,
        restartNeeded: false,
    }
});

function buildInvisName(text?: string): string {
    const seq = settings.store.sequence || INVIS_SEQUENCE;
    if (!text) return seq;
    // Interleave combining chars with letters for deep invisibility
    return text.split("").map(c => c + seq).join("");
}

function InvisNamePanel() {
    const [customText, setCustomText] = React.useState("");
    const [preview, setPreview] = React.useState(INVIS_SEQUENCE);

    React.useEffect(() => {
        setPreview(buildInvisName(customText || undefined));
    }, [customText]);

    return (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <Forms.FormTitle tag="h3">Invisible Name Generator</Forms.FormTitle>

            <Forms.FormSection>
                <Forms.FormTitle>Method</Forms.FormTitle>
                <Forms.FormText style={{ fontFamily: "monospace", fontSize: "20px", letterSpacing: "4px" }}>
                    ⃤⃟⃝
                </Forms.FormText>
                <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                    Uses Unicode combining enclosing marks: U+20E4 ⃤ · U+20DF ⃟ · U+20DD ⃝
                    These render as invisible overlays on Discord, making your name appear blank.
                </Forms.FormText>
            </Forms.FormSection>

            <Forms.FormSection>
                <Forms.FormTitle>Quick Copy — Pure Invisible Sequence</Forms.FormTitle>
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                        onClick={() => copyWithToast(settings.store.sequence || INVIS_SEQUENCE, "Invisible sequence copied!")}
                        color={Button.Colors.BRAND}
                        size={Button.Sizes.MEDIUM}
                    >
                        Copy ⃤⃟⃝
                    </Button>
                </div>
                <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                    Paste this directly as your entire Discord display name for a fully invisible name.
                </Forms.FormText>
            </Forms.FormSection>

            <Forms.FormSection>
                <Forms.FormTitle>Wrap Custom Text (Advanced)</Forms.FormTitle>
                <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                    Interleaves the combining sequence with each character of your text,
                    making it appear invisible while still being present.
                </Forms.FormText>
                <input
                    placeholder="Enter text to wrap..."
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    style={{
                        background: "var(--background-secondary)",
                        border: "1px solid var(--background-tertiary)",
                        borderRadius: "4px",
                        color: "var(--text-normal)",
                        padding: "8px 12px",
                        width: "100%",
                        marginTop: "8px",
                        fontSize: "14px"
                    }}
                />
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <Button
                        onClick={() => copyWithToast(preview, "Wrapped invisible name copied!")}
                        color={Button.Colors.BRAND}
                        size={Button.Sizes.MEDIUM}
                        disabled={!customText}
                    >
                        Copy Wrapped Name
                    </Button>
                    <Button
                        onClick={() => {
                            setCustomText("");
                            setPreview(INVIS_SEQUENCE);
                        }}
                        color={Button.Colors.RED}
                        size={Button.Sizes.MEDIUM}
                    >
                        Clear
                    </Button>
                </div>
            </Forms.FormSection>

            <Forms.FormSection>
                <Forms.FormTitle>How To Use</Forms.FormTitle>
                <Forms.FormText>
                    1. Copy the invisible sequence above{"\n"}
                    2. Go to <strong>User Settings → Profiles</strong>{"\n"}
                    3. Paste it as your <strong>Display Name</strong> or <strong>Server Nickname</strong>{"\n"}
                    4. Save — your name will appear blank in chat, member lists, and voice channels.
                </Forms.FormText>
            </Forms.FormSection>

            <Forms.FormDivider />
            <Forms.FormText type={Forms.FormText.Types.DESCRIPTION} style={{ fontSize: "11px" }}>
                Note: Discord may reject purely invisible names on some accounts. If rejected, try adding a single
                zero-width space (U+200B) before the sequence.
            </Forms.FormText>
        </div>
    );
}

export default definePlugin({
    name: "InvisName",
    description: "Generates invisible Discord names using the ⃤⃟⃝ combining Unicode method",
    authors: [Devs.Ven],
    settings,

    contextMenus: {
        "user-context"(children, { user }) {
            if (user?.id !== UserStore.getCurrentUser()?.id) return;

            children.push(
                <Menu.MenuSeparator />,
                <Menu.MenuItem
                    id="invis-name-copy"
                    label="Copy Invisible Name ⃤⃟⃝"
                    action={() => copyWithToast(settings.store.sequence || INVIS_SEQUENCE, "Invisible sequence copied!")}
                />
            );
        }
    },

    toolboxActions: {
        "Copy Invisible Name ⃤⃟⃝"() {
            copyWithToast(settings.store.sequence || INVIS_SEQUENCE, "Invisible sequence copied!");
        }
    },

    settingsAboutComponent: () => <InvisNamePanel />,
});
