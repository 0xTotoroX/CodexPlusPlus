import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFile } from "node:fs/promises";

describe("renderer injection header compatibility", () => {
  it("anchors the Codex++ menu to current and legacy application top bars only", async () => {
    const renderer = await readFile(new URL("../../../assets/inject/renderer-inject.js", import.meta.url), "utf8");

    assert.match(renderer, /appHeader:\s*'[^"]*\[class\*="ApplicationMenuTopBar"\][^']*\.app-header-tint'/);
    assert.doesNotMatch(renderer, /document\.querySelector\(["']header["']\)/);
    assert.match(renderer, /isApplicationMenuTopBar\s*\?\s*Math\.max\(4, headerRect\.top\)/);
    assert.match(renderer, /isApplicationMenuTopBar\s*\?\s*28\s*:\s*headerRect\.height/);
  });

  it("does not install Codex++ UI in embedded browser documents", async () => {
    const renderer = await readFile(new URL("../../../assets/inject/renderer-inject.js", import.meta.url), "utf8");

    assert.match(renderer, /window\.top\s*!==\s*window/);
    assert.match(renderer, /!window\.electronBridge/);
    assert.ok(renderer.includes("/^app:\\\/\\\/\\-\\//i.test(window.location.href)"));
    assert.match(renderer, /codexPlusIsNodeTestHarness/);
  });
});

describe("Stepwise generation mode contracts", () => {
  it("exposes automatic and manual generation in manager settings", async () => {
    const app = await readFile(new URL("./App.tsx", import.meta.url), "utf8");

    assert.match(app, /type StepwiseGenerationMode = "auto" \| "manual";/);
    assert.match(app, /codexAppStepwiseGenerationMode: "auto",/);
    assert.match(app, /<Field label=\{t\("模式"\)\}>/);
    assert.match(app, /\{ value: "auto", label: t\("自动生成"\) \}/);
    assert.match(app, /\{ value: "manual", label: t\("手动刷新"\) \}/);
    assert.match(app, /return value === "manual" \? "manual" : "auto";/);
  });

  it("defers manual generation until refresh and rejects stale mode results", async () => {
    const stepwise = await readFile(
      new URL("../../../assets/inject/stepwise-inject.js", import.meta.url),
      "utf8",
    );

    assert.match(stepwise, /if \(generationMode === "manual" && !manualResultVisible\)/);
    assert.match(stepwise, /state\.bridgeStatus = "manual-ready";/);
    assert.match(
      stepwise,
      /requestBridgeStepwise\(bridgeKey, userText, assistantText, generationMode, \{ userInitiated: true \}\)/,
    );
    assert.match(stepwise, /requestBridgeStepwise\(bridgeKey, userText, assistantText, "auto"\)/);
    assert.match(stepwise, /normalizedMode === "manual" && options\.userInitiated !== true/);
    assert.match(stepwise, /stepwiseGenerationMode\(\) === normalizedMode/);
    assert.match(stepwise, /state\.bridgePendingMode === normalizedMode/);
    assert.match(stepwise, /Object\.prototype\.hasOwnProperty\.call\(normalizedPatch, "generationMode"\)/);
    assert.match(stepwise, /if \(!Object\.prototype\.hasOwnProperty\.call\(nextSettings, "generationMode"\)\)/);
    assert.match(stepwise, /nextSettings\.generationMode = stepwiseGenerationMode\(\);/);
    const appearanceStart = stepwise.indexOf("function appearanceSettingsHtml()");
    const settingsStart = stepwise.indexOf("function settingsHtml()", appearanceStart);
    const appearanceMarkup = stepwise.slice(appearanceStart, settingsStart);
    assert.doesNotMatch(appearanceMarkup, /data-action="generation-mode"/);
    const footerStart = stepwise.indexOf('<div class="csw-runtime-grid"', settingsStart);
    const generationModeControl = stepwise.indexOf('data-action="generation-mode"', footerStart);
    const promptClickControl = stepwise.indexOf('data-action="prompt-click-mode"', footerStart);
    assert.ok(footerStart >= 0 && generationModeControl > footerStart && promptClickControl > generationModeControl);
    assert.match(stepwise, /<span class="csw-metric-label">模式<\/span>/);
    assert.match(stepwise, /return normalizeGenerationMode\(value\) === "manual" \? "手动刷新" : "自动生成";/);
    assert.match(stepwise, /return setGenerationMode\(nextGenerationMode\(\)\);/);
    assert.match(stepwise, /return writePromptClickMode\(nextPromptClickMode\(\)\);/);
    assert.match(stepwise, /button\.csw-metric-action\s*\{[^}]*padding:\s*0;/s);
    assert.match(stepwise, /\.csw-generation-mode\s*\{[^}]*min-width:\s*max-content;/s);
    assert.match(stepwise, /\.csw-click-mode\s*\{[^}]*min-width:\s*max-content;/s);
    assert.match(
      stepwise,
      /\.csw-metric-value,[\s\S]*?\.csw-metric-action\s*\{[^}]*overflow:\s*visible;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*nowrap;/,
    );
    assert.match(
      stepwise,
      /@container csw-panel \(max-width: 440px\)[\s\S]*?\.csw-settings-footer\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(max-content, 1fr\) auto;/,
    );
    assert.match(
      stepwise,
      /@container csw-panel \(max-width: 440px\)[\s\S]*?\.csw-runtime-grid\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*max-content max-content;[^}]*width:\s*max-content;/,
    );
    assert.match(
      stepwise,
      /@container csw-panel \(max-width: 440px\)[\s\S]*?\.csw-command-button\s*\{[^}]*flex:\s*0 0 30px;[^}]*height:\s*30px;[^}]*padding:\s*0;[^}]*width:\s*30px;/,
    );
    assert.match(
      stepwise,
      /@container csw-panel \(max-width: 440px\)[\s\S]*?\.csw-command-label\s*\{[^}]*display:\s*none;/,
    );
    assert.match(
      stepwise,
      /class="csw-command-button"[^>]*title="\$\{escapeAttr\(title\)\}"[^>]*aria-label="\$\{escapeAttr\(title\)\}"/,
    );
    assert.match(
      stepwise,
      /@container csw-panel \(max-width: 360px\)[\s\S]*?\.csw-click-mode \.csw-metric-label\s*\{[^}]*display:\s*none;/,
    );
    assert.match(
      stepwise,
      /@container csw-panel \(max-width: 320px\)[\s\S]*?\.csw-metric-label\s*\{[^}]*display:\s*none;/,
    );
    assert.match(
      stepwise,
      /@container csw-panel \(max-width: 320px\)[\s\S]*?\.csw-command-button\s*\{[^}]*flex:\s*0 0 28px;[^}]*height:\s*28px;[^}]*width:\s*28px;/,
    );
    const toggleStart = stepwise.indexOf("async function setGenerationMode(value)");
    const immediateCancel = stepwise.indexOf(
      "applyRuntimeSettings({ ...(state.settings || {}), generationMode: nextMode });",
      toggleStart,
    );
    const settingsSave = stepwise.indexOf('bridgeCall("/settings/set", {', toggleStart);
    assert.ok(toggleStart >= 0 && immediateCancel > toggleStart && settingsSave > immediateCancel);

    const progressStart = stepwise.indexOf("function nextProgressState()");
    const manualProgressGuard = stepwise.indexOf('if (stepwiseGenerationMode() === "manual") return null;', progressStart);
    const localScanProgress = stepwise.indexOf('state.scanStatus === "assistant-changed"', progressStart);
    assert.ok(progressStart >= 0 && manualProgressGuard > progressStart && localScanProgress > manualProgressGuard);
    assert.match(stepwise, /title: "当前为手动模式"/);
    assert.doesNotMatch(stepwise, /title: "待生成"/);

    const outlineExpressionStart = stepwise.indexOf("function usesOutlineExpression(");
    const outlineExpressionEnd = stepwise.indexOf("function resolveFabExpression(", outlineExpressionStart);
    const outlineExpression = stepwise.slice(outlineExpressionStart, outlineExpressionEnd);
    assert.match(outlineExpression, /stepwiseWaitingForManualRefresh\(\)/);

    const runtimePresentationStart = stepwise.indexOf("function settingsRuntimePresentation(");
    const runtimePresentationEnd = stepwise.indexOf("function settingsCommandHtml(", runtimePresentationStart);
    const runtimePresentation = stepwise.slice(runtimePresentationStart, runtimePresentationEnd);
    assert.match(runtimePresentation, /!outlineExpression && stepwiseWaitingForManualRefresh\(settings\)/);

    const scanStart = stepwise.indexOf("function scan(");
    const outlineRefresh = stepwise.indexOf("void refreshOutline({ message, assistantHash: hash });", scanStart);
    const manualScanBranch = stepwise.indexOf('if (generationMode === "manual" && !manualResultVisible)', scanStart);
    const cachedScanBranch = stepwise.indexOf('else if (hasSuccessfulCache)', scanStart);
    const automaticGenerate = stepwise.indexOf('requestBridgeStepwise(bridgeKey, userText, assistantText, "auto")', scanStart);
    assert.ok(scanStart >= 0 && outlineRefresh > scanStart && manualScanBranch > outlineRefresh);
    assert.ok(cachedScanBranch > manualScanBranch);
    assert.ok(automaticGenerate > cachedScanBranch);
  });
});
