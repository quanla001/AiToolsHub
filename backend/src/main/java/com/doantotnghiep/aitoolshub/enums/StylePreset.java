package com.doantotnghiep.aitoolshub.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public enum StylePreset {

    THREE_D_MODEL("3d-model"),
    ANALOG_FILM("analog-film"),
    ANIME("anime"),
    CINEMATIC("cinematic"),
    COMIC_BOOK("comic-book"),
    DIGITAL_ART("digital-art"),
    ENHANCE("enhance"),
    FANTASY_ART("fantasy-art"), //3m
    ISOMETRIC("isometric"),
    LINE_ART("line-art"),
    LOW_POLY("low-poly"),
    MODELING_COMPOUND("modeling-compound"),
    NEON_PUNK("neon-punk"),
    ORIGAMI("origami"),
    PHOTOGRAPHIC("photographic"),
    PIXEL_ART("pixel-art"),
    TILE_TEXTURE("tile-texture");

    private String style;

    public static StylePreset fromString(String style) {
        for (StylePreset preset : StylePreset.values()) {
            if (preset.style.equalsIgnoreCase(style)) {
                return preset;
            }
        }
        throw new IllegalArgumentException("Unknown style: " + style);
    }
}
