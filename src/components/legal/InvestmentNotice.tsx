import { investmentNotice } from '../../data/legal';

// 모의투자 전용·투자 권유 아님·AI 신호 참고용 면책 문구 (가입 화면, 푸터, 약관에서 같이 쓴다)
export function InvestmentNotice({ compact = false }: { compact?: boolean }) {
    return (
        <aside
            className={`investment-notice${compact ? ' investment-notice-compact' : ''}`}
            aria-label={investmentNotice.title}
        >
            <strong>{investmentNotice.title}</strong>
            <ul>
                {investmentNotice.lines.map(line => (
                    <li key={line}>{line}</li>
                ))}
            </ul>
        </aside>
    );
}
