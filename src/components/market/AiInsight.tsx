import type { Stock } from '../../types/market';

interface AiInsightProps {
    selectedStock: Stock;
    featured?: boolean;
}

export function AiInsight({ selectedStock, featured = false }: AiInsightProps) {
    const hold = Math.round((100 - selectedStock.buyProbability) * 0.65);
    const probabilities = [
        { label: '매수', value: selectedStock.buyProbability, className: 'buy' },
        { label: '관망', value: hold, className: 'hold' },
        { label: '매도', value: 100 - selectedStock.buyProbability - hold, className: 'sell' },
    ];
    return (
        <section className={`panel ai-panel ${featured ? 'ai-featured' : ''}`} aria-label="AI 판단">
            <div className="ai-heading">
                <h2>AI 판단</h2>
                <span className="pill">예시</span>
            </div>
            <div className="signal-summary">
                <span>
                    {selectedStock.name} · {selectedStock.symbol} · {selectedStock.exchange}
                </span>
                <strong>{selectedStock.buyProbability > 50 ? '매수 우세' : '관망 우세'}</strong>
                <p>세 가지 판단의 확률 분포</p>
            </div>
            <div className="probabilities">
                {probabilities.map(item => (
                    <div className="probability" key={item.label}>
                        <div className="probability-label">
                            <span>{item.label}</span>
                            <strong>
                                {item.value}
                                <small>%</small>
                            </strong>
                        </div>
                        <div className="bar-track">
                            <div className={item.className} style={{ width: `${item.value}%` }} />
                        </div>
                    </div>
                ))}
            </div>
            <dl className="analysis-metadata">
                <div>
                    <dt>분석 대상</dt>
                    <dd>{selectedStock.name}</dd>
                </div>
                <div>
                    <dt>결과 제공</dt>
                    <dd>모델 연동 예정</dd>
                </div>
            </dl>
            <p className="ai-note">
                화면 확인용 예시입니다.
                <br />
                실제 분석 결과는 모델 연동 후 제공됩니다.
            </p>
        </section>
    );
}
