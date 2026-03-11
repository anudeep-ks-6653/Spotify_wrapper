package com.spotify.wrapper.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class DevicesDto {
    private List<DeviceDto> devices;
    
    public List<DeviceDto> getDevices() {
        return devices;
    }
    
    public void setDevices(List<DeviceDto> devices) {
        this.devices = devices;
    }
    
    public static class DeviceDto {
        private String id;
        private String name;
        private String type;
        @JsonProperty("is_active")
        private boolean isActive;
        @JsonProperty("is_private_session")
        private boolean isPrivateSession;
        @JsonProperty("is_restricted")
        private boolean isRestricted;
        @JsonProperty("volume_percent")
        private int volumePercent;
        @JsonProperty("supports_volume")
        private boolean supportsVolume;
        
        // Getters and Setters
        public String getId() {
            return id;
        }
        
        public void setId(String id) {
            this.id = id;
        }
        
        public String getName() {
            return name;
        }
        
        public void setName(String name) {
            this.name = name;
        }
        
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
        }
        
        public boolean isActive() {
            return isActive;
        }
        
        public void setActive(boolean active) {
            isActive = active;
        }
        
        public boolean isPrivateSession() {
            return isPrivateSession;
        }
        
        public void setPrivateSession(boolean privateSession) {
            isPrivateSession = privateSession;
        }
        
        public boolean isRestricted() {
            return isRestricted;
        }
        
        public void setRestricted(boolean restricted) {
            isRestricted = restricted;
        }
        
        public int getVolumePercent() {
            return volumePercent;
        }
        
        public void setVolumePercent(int volumePercent) {
            this.volumePercent = volumePercent;
        }
        
        public boolean isSupportsVolume() {
            return supportsVolume;
        }
        
        public void setSupportsVolume(boolean supportsVolume) {
            this.supportsVolume = supportsVolume;
        }
    }
}
