/**
 * 공유 상수 - DMAP 기본 스킬 목록 및 API 설정
 *
 * DMAP_SKILLS: DMAP 빌더 기본 스킬 7종 + 외부 연동 스킬
 * PROMPT_SKILL: 자유 프롬프트 모드 가상 스킬 (__prompt__)
 * SKILL_CATEGORIES: 스킬 카테고리별 라벨/색상 매핑
 *
 * @module shared/constants
 */

import type { SkillMeta } from './types.js';

/**
 * DMAP 빌더 기본 스킬 목록 (고정 순서)
 *
 * 사이드바에서 이 순서대로 표시됨. discoverSkills()에서 이 순서를 우선 적용.
 * 추가 스킬은 skills/ 디렉토리 동적 탐색으로 발견.
 */
export const DMAP_SKILLS: SkillMeta[] = [
  {
    name: 'team-planner',
    displayName: 'AI팀(플러그인) 기획서',
    description: '새로운 AI팀(플러그인) 기획서 작성',
    icon: '📋',
    category: 'core',
    hasApprovalGates: true,
  },
  {
    name: 'develop-plugin',
    displayName: '플러그인(AI팀) 개발',
    description: 'AI팀 기획서 기반 플러그인 개발',
    icon: '🔨',
    category: 'core',
    hasApprovalGates: true,
  },
  {
    name: 'publish',
    displayName: 'GitHub 배포',
    description: '개발 완료된 플러그인을 GitHub에 배포',
    icon: '🚀',
    category: 'setup',
    hasApprovalGates: true,
  },
  {
    name: 'setup',
    displayName: '플러그인 초기설정',
    description: 'DMAP 플러그인 초기 설정 및 상태 확인',
    icon: '⚙️',
    category: 'setup',
    hasApprovalGates: false,
  },
  {
    name: 'add-ext-skill',
    displayName: '플러그인 추가',
    description: '외부 플러그인 연동 추가',
    icon: '➕',
    category: 'utility',
    hasApprovalGates: true,
  },
  {
    name: 'remove-ext-skill',
    displayName: '플러그인 제거',
    description: '외부 플러그인 연동 제거',
    icon: '➖',
    category: 'utility',
    hasApprovalGates: true,
  },
  {
    name: 'help',
    displayName: '도움말',
    description: '사용 가능한 명령어 및 사용법 안내',
    icon: '❓',
    category: 'utility',
    hasApprovalGates: false,
  },
  {
    name: 'ext-github-release-manager',
    displayName: 'Release 관리',
    description: 'GitHub Release 자동화 (github-release-manager 플러그인)',
    icon: '📦',
    category: 'external',
    hasApprovalGates: true,
  },
];

/** 자유 프롬프트 모드 가상 스킬 - SKILL.md 없이 직접 Claude SDK에 프롬프트 전달 */
export const PROMPT_SKILL: SkillMeta = {
  name: '__prompt__',
  displayName: '프롬프트',
  description: '자유 프롬프트 실행',
  icon: '⚡',
  category: 'core',
  hasApprovalGates: true,
};

/** 스킬 카테고리 메타데이터 - 사이드바 메뉴에서 카테고리별 라벨/색상 표시에 사용 */
export const SKILL_CATEGORIES = {
  core: { label: '핵심', color: 'blue' },
  utility: { label: '유틸리티', color: 'gray' },
  setup: { label: '설정', color: 'green' },
  external: { label: '외부 연동', color: 'purple' },
} as const;

/** API 기본 경로 - 프론트엔드 fetch 호출 시 사용 */
export const API_BASE = '/api';
