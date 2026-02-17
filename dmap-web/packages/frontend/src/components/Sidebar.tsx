/**
 * 사이드바 컴포넌트 - 플러그인 전환 + 스킬 메뉴 + 에이전트 동기화 + 설정.
 * 메뉴 기반(core/utility/external) 또는 레거시(SKILL_CATEGORIES) 렌더링 지원
 * @module components/Sidebar
 */
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../stores/appStore.js';
import { SkillCard } from './SkillCard.js';
import { SettingsMenu } from './SettingsMenu.js';
import { PluginSwitcher } from './PluginSwitcher.js';
import { AddPluginDialog } from './AddPluginDialog.js';
import { ConfirmSwitchDialog } from './ConfirmSwitchDialog.js';
import { MenuManageDialog } from './MenuManageDialog.js';
import { Tooltip } from './Tooltip.js';
import { useT } from '../i18n/index.js';
import { useLangStore } from '../stores/langStore.js';
import { SKILL_CATEGORIES, PROMPT_SKILL } from '@dmap-web/shared';
import type { SkillMeta, MenuSkillItem } from '@dmap-web/shared';

/**
 * 사이드바 - 플러그인 선택기 + 도구 버튼(추가/프롬프트/설정) + 에이전트 동기화 + 스킬 메뉴 목록
 */
export function Sidebar() {
  const { skills, selectedSkill, selectSkill, isStreaming, fetchSkills, fetchMenus, menus, selectedPlugin, fetchPlugins, syncAgents, pendingApproval, setPendingSkillSwitch } = useAppStore(useShallow((s) => ({
    skills: s.skills,
    selectedSkill: s.selectedSkill,
    selectSkill: s.selectSkill,
    isStreaming: s.isStreaming,
    fetchSkills: s.fetchSkills,
    fetchMenus: s.fetchMenus,
    menus: s.menus,
    selectedPlugin: s.selectedPlugin,
    fetchPlugins: s.fetchPlugins,
    syncAgents: s.syncAgents,
    pendingApproval: s.pendingApproval,
    setPendingSkillSwitch: s.setPendingSkillSwitch,
  })));
  const { lang } = useLangStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'fail'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const t = useT();

  useEffect(() => {
    fetchPlugins().then(() => {
      fetchSkills();
      fetchMenus();
    });
  }, [fetchPlugins, fetchSkills, fetchMenus]);

  // 스킬명 → SkillMeta 매핑 테이블 - 메뉴 아이템에서 스킬 메타데이터 조회용
  const skillMap = new Map<string, SkillMeta>();
  for (const skill of skills) {
    skillMap.set(skill.name, skill);
  }

  /**
   * 에이전트 동기화 - 플러그인 로컬 프로젝트의 agents/ 디렉토리를 스캔하여 에이전트 목록 갱신
   */
  const handleSyncAgents = async () => {
    if (!selectedPlugin || syncStatus === 'syncing') return;
    setSyncStatus('syncing');
    setSyncMessage(t('agentSync.syncing'));
    try {
      const result = await syncAgents(selectedPlugin.id);
      if (result.count > 0) {
        setSyncStatus('success');
        setSyncMessage(t('agentSync.success').replace('{{count}}', String(result.count)));
      } else {
        setSyncStatus('success');
        setSyncMessage(t('agentSync.noAgents'));
      }
    } catch {
      setSyncStatus('fail');
      setSyncMessage(t('agentSync.fail'));
    }
    // 3초 후 상태 초기화
    setTimeout(() => { setSyncStatus('idle'); setSyncMessage(''); }, 3000);
  };

  /**
   * 스킬 클릭 핸들러 - 스트리밍/승인 대기 중이면 전환 대기열에 추가, 아니면 즉시 선택
   */
  const handleSkillClick = (skill: SkillMeta) => {
    if (isStreaming || pendingApproval) {
      setPendingSkillSwitch(skill);
    } else {
      selectSkill(skill);
    }
  };

  /**
   * 메뉴 스킬 아이템 렌더링 - skillMap에서 메타데이터 조회 후 메뉴 라벨로 오버라이드하여 SkillCard 표시
   */
  const renderMenuSkill = (item: MenuSkillItem) => {
    const skill = skillMap.get(item.name);
    if (!skill) return null;
    const menuLabel = item.labels[lang] || item.labels.ko;
    const displaySkill = menuLabel ? { ...skill, displayName: menuLabel } : skill;
    return (
      <SkillCard
        key={skill.name}
        skill={displaySkill}
        isSelected={selectedSkill?.name === skill.name}
        onClick={() => handleSkillClick(skill)}
      />
    );
  };

  /**
   * 평탄 카테고리 렌더링 (utility, external) - 구분선 + 카테고리 제목 + 스킬 목록
   */
  const renderFlatCategory = (categoryKey: string, items: MenuSkillItem[]) => {
    const rendered = items.map(renderMenuSkill).filter(Boolean);
    if (rendered.length === 0) return null;
    return (
      <div key={categoryKey} className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 px-2 mb-2">
          {t(`category.${categoryKey}` as keyof import('../i18n/types.js').Translations)}
        </h2>
        <div className="space-y-1">
          {rendered}
        </div>
      </div>
    );
  };

  /**
   * 메뉴 기반 네비게이션 렌더링 - core(하위 카테고리 포함) + utility + external 순서
   */
  const renderMenusNav = () => {
    if (!menus) return null;

    return (
      <>
        {/* Core 카테고리 - 하위 카테고리(서브카테고리) 포함 */}
        {menus.core.length > 0 && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 px-2 mb-2">
              {t('category.core')}
            </h2>
            {menus.core.map((subcat, idx) => {
              const rendered = subcat.skills.map(renderMenuSkill).filter(Boolean);
              if (rendered.length === 0) return null;
              const showSubLabel = menus.core.length > 1 || subcat.id !== 'default';
              return (
                <div key={subcat.id} className={idx > 0 ? 'mt-3' : ''}>
                  {showSubLabel && (
                    <h3 className="text-[13px] font-medium text-gray-400 dark:text-gray-500 px-2 mb-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] opacity-60">&#9654;</span>
                      {subcat.labels[lang] || subcat.labels.ko || subcat.id}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {rendered}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Utility, External 카테고리 - 구분선과 함께 순서대로 렌더링 */}
        {renderFlatCategory('utility', menus.utility)}
        {renderFlatCategory('external', menus.external)}
      </>
    );
  };

  /**
   * 레거시 네비게이션 렌더링 - SKILL_CATEGORIES 기반 분류 (메뉴 미로드 시 폴백)
   */
  const renderLegacyNav = () => {
    const grouped = skills.reduce<Record<string, SkillMeta[]>>((acc, skill) => {
      const cat = skill.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    }, {});

    return (
      <>
        {Object.entries(SKILL_CATEGORIES).map(([key, cat]) => {
          const categorySkills = grouped[key];
          if (!categorySkills?.length) return null;

          return (
            <div key={key}>
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-2">
                {t(`category.${key}` as keyof import('../i18n/types.js').Translations) || cat.label}
              </h2>
              <div className="space-y-1">
                {categorySkills.map((skill) => (
                  <SkillCard
                    key={skill.name}
                    skill={skill}
                    isSelected={selectedSkill?.name === skill.name}
                    onClick={() => handleSkillClick(skill)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <aside className="w-full h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <PluginSwitcher disabled={isStreaming} />
          <div className="flex items-center gap-1">
            <div className="relative group">
              <button
                onClick={() => setShowAddDialog(true)}
                className="p-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <Tooltip text={t('plugin.add')} />
            </div>
            <div className="relative group">
              <button
                onClick={() => handleSkillClick(PROMPT_SKILL)}
                className={`p-1.5 rounded-full border transition-colors ${
                  selectedSkill?.name === '__prompt__'
                    ? 'border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </button>
              <Tooltip text={t('resume.tooltip')} />
            </div>
            <SettingsMenu version={selectedPlugin?.version || ''} />
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
          {selectedPlugin?.description || t('sidebar.subtitle')}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* 에이전트 동기화 + 메뉴 관리 버튼 영역 */}
        {selectedPlugin && (
          <div className="px-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncAgents}
                disabled={isStreaming || syncStatus === 'syncing'}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  syncStatus === 'success'
                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : syncStatus === 'fail'
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                } ${(isStreaming || syncStatus === 'syncing') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {syncStatus === 'syncing' ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                )}
                <span>{syncMessage || t('agentSync.label')}</span>
                <div className="relative group">
                  <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 cursor-help flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                  </svg>
                  <Tooltip text={t('agentSync.tooltip')} wide />
                </div>
              </button>
              {/* 메뉴 관리 버튼 */}
              <div className="relative group">
                <button
                  onClick={() => setShowMenuDialog(true)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </button>
                <Tooltip text={t('menu.manage')} />
              </div>
            </div>
          </div>
        )}

        {/* 스킬 목록: 메뉴 로드 완료 시 메뉴 기반, 아니면 레거시 카테고리 기반 렌더링 */}
        {menus ? renderMenusNav() : renderLegacyNav()}
      </nav>

      {/* 하단: 현재 플러그인 이름 + 버전 표시 */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-400 truncate">
        {selectedPlugin?.displayNames?.[lang] || selectedPlugin?.name || 'Plugin'} v{selectedPlugin?.version || '...'}
      </div>

      <ConfirmSwitchDialog />

      {showAddDialog && (
        <AddPluginDialog
          onClose={() => setShowAddDialog(false)}
          onAdded={() => setShowAddDialog(false)}
        />
      )}

      {showMenuDialog && (
        <MenuManageDialog
          onClose={() => {
            setShowMenuDialog(false);
            fetchMenus();
          }}
        />
      )}
    </aside>
  );
}
