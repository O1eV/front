import { Icon } from '../ui/Icon';
import type { Stock, Page, MarketFilter } from '../../types/market';

import { MarketRow } from './MarketRow';

interface MarketTableProps {
    page: Page;
    filteredStocks: Stock[];
    searchQuery: string;
    setSearchQuery: (searchQuery: string) => void;
    signalFilter: MarketFilter;
    setSignalFilter: (signalFilter: MarketFilter) => void;
    favoriteSymbols: string[];
    toggleFavorite: (symbol: string) => void;
    setSelectedStock: (stock: Stock) => void;
    setToastMessage: (message: string) => void;
}

export function MarketTable({
    page,
    filteredStocks,
    searchQuery,
    setSearchQuery,
    signalFilter,
    setSignalFilter,
    favoriteSymbols,
    toggleFavorite,
    setSelectedStock,
    setToastMessage,
}: MarketTableProps) {
    return (
        <section className="panel market-panel">
            <div className="section-heading">
                <div>
                    <h2>
                        {page === '신호 이력'
                            ? '최근 신호 이력'
                            : page === '관심 종목'
                              ? '나의 관심 종목'
                              : '관심 있게 볼 시장'}{' '}
                        <span className="heading-count">{filteredStocks.length}</span>
                    </h2>

                    <p>
                        {page === '신호 이력'
                            ? '시간에 따른 신호 변화를 살펴보세요.'
                            : '시장의 움직임과 AI 신호를 함께 살펴보세요.'}
                    </p>
                </div>

                <label className="search">
                    <Icon name="search" size={17} />

                    <input
                        aria-label="종목 검색"
                        placeholder="종목명 또는 종목코드 검색"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />

                    <kbd>⌕</kbd>
                </label>
            </div>

            <div className="table-tabs">
                {(['전체', '매수 신호'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setSignalFilter(f)}
                        className={signalFilter === f ? 'active' : ''}
                    >
                        {f}
                        {f === '전체' && <span>4</span>}
                    </button>
                ))}

                <span className="table-info">국내 주식 · 원화</span>
            </div>

            <div className="table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th className="favorite-cell" />
                            <th>종목</th>
                            <th>현재가</th>
                            <th>전일 대비</th>
                            <th>7일 차트</th>
                            <th>AI 신호</th>
                            <th>{page === '신호 이력' ? '발생 시간' : '매수 확률'}</th>
                            <th />
                        </tr>
                    </thead>

                    <tbody>
                        {filteredStocks.map((stock, index) => (
                            <MarketRow
                                key={stock.symbol}
                                stock={stock}
                                index={index}
                                showHistory={page === '신호 이력'}
                                favoriteSymbols={favoriteSymbols}
                                toggleFavorite={toggleFavorite}
                                setSelectedStock={setSelectedStock}
                            />
                        ))}
                    </tbody>
                </table>

                {filteredStocks.length === 0 && (
                    <div className="no-results">
                        {searchQuery
                            ? '검색 결과가 없어요. 다른 종목명을 입력해주세요.'
                            : '아직 관심 종목이 없어요. 별을 눌러 종목을 추가해보세요.'}
                    </div>
                )}
            </div>

            <div className="table-footer">
                <span>모든 수치는 UI 시연을 위한 샘플 데이터입니다.</span>

                <button
                    onClick={() => {
                        setToastMessage('현재 MVP는 국내 주식 4종목을 미리보기로 제공합니다.');
                    }}
                >
                    지원 종목 안내 <Icon name="arrow" size={14} />
                </button>
            </div>
        </section>
    );
}
