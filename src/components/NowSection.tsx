import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Profile } from '../types';
import { BookOpen, Code, Compass, Lightbulb, Coffee, Music, Languages, Moon, Sparkles, Star, Zap, Heart } from 'lucide-react';

interface NowSectionProps {
  profile: Profile | null;
