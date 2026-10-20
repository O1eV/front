import { Icon } from '../components/ui/Icon';
import { Link } from 'react-router-dom';

export function PortfolioPage() {
    return (
        <section className="panel empty-state">
            <div className="empty-icon">
                <Icon name="wallet" size={32} />
            </div>
            <h2>첫 투자 연습을 준비하고 있어요.</h2>
            <p>
                모의투자는 API 연동 후 제공됩니다.
                <br />
                지금은 대시보드에서 종목과 AI 신호를 둘러보세요.
            </p>
            <Link className="primary" to="/">
                시장 둘러보기 <Icon name="arrow" size={16} />
            </Link>
        </section>
    );
}
