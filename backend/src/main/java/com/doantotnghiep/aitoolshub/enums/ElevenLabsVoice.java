package com.doantotnghiep.aitoolshub.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public enum ElevenLabsVoice {
    ADAM("Adam", "pNInz6obpgDQGcFmaJgB"),
    ALICE("Alice", "Xb7hH8MSUJpSbSDYk0k2"),
    ANTONI("Antoni", "ErXwobaYiN019PkySvjV"),
    ARIA("Aria", "ErXwobaYiN019PkySvjV"),
    ARNOLD("Arnold", "VR6AewLTigWG4xSOukaG"),
    BILL("Bill", "pqHfZKP75CvOlQylNhV4"),
    CALLUM("Callum", "N2lVS1w4EtoT3dr4eOWO"),
    ELLI("Elli", "MF3mGyEYCl7XYWbV9V6O"),
    EMILY("Emily", "LcfcDJNUP1GQjkzn1xUU"),
    FREYA("Freya", "jsCqWAovK2LkecY7zXl4"),
    SARAH("Sarah", "EXAVITQu4vr4xnSDxMaL"),
    SERENA("Serena", "pMsXgVXv3BLzUgSXRplE"),
    THOMAS("Thomas", "GBv7mTt0atIp3Br8iCZE"),
    MICHEAL("Michael", "flq6f7yk4E4fJM5XTYuZ"),
    ETHAN("Ethan", "g5CIjZEefAph4nQFvHAz"),
    GEORGE("George", "Yko7PKHZNXotIFUBG7I9"),
    PAUL("Paul", "5Q0t7uMcjvnagumLfvZi"),
    GIGI("Gigi", "jBpfuIE2acCO8z3wKNLl"),
    HUYEN_TRANG("Huyen Trang","BlZK9tHPU6XXjwOSIiYA"),
    LY_HAI("Ly Hai","7hsfEc7irDn6E8br0qfw"),
    TRAN_KIM_HUNG("Tran Kim Hung","DXiwi9uoxet6zAiZXynP"),
    SANTA_CLAUS("Santa Claus", "knrPHWnBmmDHMoiMeP3l");


    private  String name;
    private  String id;

    public static ElevenLabsVoice fromName(String name) {
        for (ElevenLabsVoice voice : values()) {
            if (voice.getName().equalsIgnoreCase(name)) {
                return voice;
            }
        }
        throw new IllegalArgumentException("Unknown voice: " + name);
    }

    public String getVoiceId() {
        return id;
    }
}