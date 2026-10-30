import { Link } from 'react-router-dom';
import { pagePaths } from '../../routes/paths';
import { InvestmentNotice } from '../legal/InvestmentNotice';

export function Footer() {
    return (
        <footer>
            <InvestmentNotice compact />
            <div className="footer-meta">
                <span>O1eV · UI preview</span>
                <span>시세와 분석 결과는 샘플 데이터입니다.</span>
                <nav className="footer-links" aria-label="법률 문서">
                    <Link to={pagePaths.terms}>이용약관</Link>
                    <Link to={pagePaths.privacy}>개인정보 처리방침</Link>
                </nav>
            </div>
        </footer>
    );
}
